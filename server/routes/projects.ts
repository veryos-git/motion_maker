// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
import { join } from "node:path";
import {
  addFrames,
  createProject,
  deleteFrame,
  getFramePath,
  getProject,
  reorderFrames,
  updateSettings,
} from "../services/projectStore.ts";
import {
  exportGif,
  generatePreview,
  type Adjustments,
} from "../services/ffmpeg.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

const projectPattern = /^\/api\/projects\/([^/]+)/;

export async function handleProjects(
  req: Request,
  url: URL,
): Promise<Response> {
  const path = url.pathname;

  // POST /api/projects
  if (path === "/api/projects" && req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      const project = await createProject(body.name || "Untitled");
      return json(project, 201);
    } catch (e: unknown) {
      return err(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }

  const m = path.match(projectPattern);
  if (!m) return err("Not found", 404);

  const pid = m[1];

  // GET /api/projects/:id
  if (path === `/api/projects/${pid}` && req.method === "GET") {
    const project = await getProject(pid);
    if (!project) return err("Project not found", 404);
    return json(project);
  }

  // PUT /api/projects/:id/settings
  if (path === `/api/projects/${pid}/settings` && req.method === "PUT") {
    try {
      const body = await req.json();
      const project = await updateSettings(pid, body);
      return json(project);
    } catch (e: unknown) {
      return err(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }

  // POST /api/projects/:id/frames
  if (path === `/api/projects/${pid}/frames` && req.method === "POST") {
    try {
      const formData = await req.formData();
      const files: { filename: string; data: Uint8Array }[] = [];

      for (const [_, value] of formData.entries()) {
        if (value instanceof File) {
          files.push({
            filename: value.name || "frame.jpg",
            data: new Uint8Array(await value.arrayBuffer()),
          });
        }
      }

      if (!files.length) return err("No frames uploaded");

      const frames = await addFrames(pid, files);
      return json(frames, 201);
    } catch (e: unknown) {
      return err(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }

  // DELETE /api/projects/:id/frames/:frameId
  const deleteMatch = path.match(
    /^\/api\/projects\/([^/]+)\/frames\/([^/]+)$/,
  );
  if (deleteMatch && req.method === "DELETE") {
    try {
      await deleteFrame(deleteMatch[1], decodeURIComponent(deleteMatch[2]));
      return json({ ok: true });
    } catch (e: unknown) {
      return err(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }

  // PUT /api/projects/:id/frames/reorder
  if (
    path === `/api/projects/${pid}/frames/reorder` && req.method === "PUT"
  ) {
    try {
      const body = await req.json();
      await reorderFrames(pid, body.frameIds || []);
      return json({ ok: true });
    } catch (e: unknown) {
      return err(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }

  // POST /api/projects/:id/preview
  if (path === `/api/projects/${pid}/preview` && req.method === "POST") {
    try {
      const project = await getProject(pid);
      if (!project) return err("Project not found", 404);
      if (!project.frames.length) return err("No frames in project");

      const frameNames = project.frames
        .sort((a, b) => a.order - b.order)
        .map((f) => f.filename);

      await generatePreview(
        `server/projects/${pid}`,
        frameNames,
        project.fps,
        project.adjustments,
        project.crop,
      );

      return json({ url: `/api/projects/${pid}/assets/preview.mp4` });
    } catch (e: unknown) {
      return err(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }

  // POST /api/projects/:id/export
  if (path === `/api/projects/${pid}/export` && req.method === "POST") {
    try {
      const project = await getProject(pid);
      if (!project) return err("Project not found", 404);
      if (!project.frames.length) return err("No frames in project");

      const frameNames = project.frames
        .sort((a, b) => a.order - b.order)
        .map((f) => f.filename);

      await exportGif(
        `server/projects/${pid}`,
        frameNames,
        project.fps,
        project.adjustments,
        project.crop,
        project.gifSettings.width,
        project.gifSettings.height,
        project.gifSettings.quality,
      );

      return json({ url: `/api/projects/${pid}/assets/export.gif` });
    } catch (e: unknown) {
      return err(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }

  // GET /api/projects/:id/frames/data/:frameId
  const frameDataMatch = path.match(
    /^\/api\/projects\/([^/]+)\/frames\/data\/([^/]+)$/,
  );
  if (frameDataMatch && req.method === "GET") {
    try {
      const project = await getProject(frameDataMatch[1]);
      if (!project) return err("Project not found", 404);

      const frame = project.frames.find((f) =>
        f.id === decodeURIComponent(frameDataMatch[2])
      );
      if (!frame) return err("Frame not found", 404);

      const fp = getFramePath(frameDataMatch[1], frame);
      const file = await Deno.open(fp, { read: true });
      const ext = frame.filename.substring(frame.filename.lastIndexOf("."));
      const mimeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
      };

      return new Response(file.readable, {
        headers: {
          "content-type": mimeMap[ext] || "application/octet-stream",
          "cache-control": "public, max-age=3600",
        },
      });
    } catch (e: unknown) {
      return err(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }

  // GET /api/projects/:id/assets/:file
  const assetMatch = path.match(
    /^\/api\/projects\/([^/]+)\/assets\/([^/]+)$/,
  );
  if (assetMatch && req.method === "GET") {
    try {
      const assetPath = join(
        "server/projects",
        assetMatch[1],
        assetMatch[2],
      );
      const file = await Deno.open(assetPath, { read: true });
      const ext = assetMatch[2].substring(assetMatch[2].lastIndexOf("."));
      const mimeMap: Record<string, string> = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".gif": "image/gif",
        ".png": "image/png",
      };

      return new Response(file.readable, {
        headers: {
          "content-type": mimeMap[ext] || "application/octet-stream",
        },
      });
    } catch {
      return err("Asset not found", 404);
    }
  }

  return err("Not found", 404);
}
