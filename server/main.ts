// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
import { checkFfmpeg } from "./services/ffmpeg.ts";
import { handleProjects } from "./routes/projects.ts";

const PORT = parseInt(Deno.env.get("PORT") || "3000");

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function mimeType(p: string): string {
  const ext = p.substring(p.lastIndexOf(".")).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

async function serveStatic(url: URL): Promise<Response | null> {
  let fp = `client/dist${url.pathname}`;
  if (url.pathname === "/") fp = "client/dist/index.html";

  try {
    const stat = await Deno.stat(fp);
    if (stat.isDirectory) {
      fp = join(fp, "index.html");
    }
    const file = await Deno.open(fp, { read: true });
    return new Response(file.readable, {
      headers: { "content-type": mimeType(fp) },
    });
  } catch {
    if (!url.pathname.startsWith("/api/")) {
      try {
        const file = await Deno.open("client/dist/index.html", {
          read: true,
        });
        return new Response(file.readable, {
          headers: { "content-type": "text/html" },
        });
      } catch {
        return null;
      }
    }
    return null;
  }
}

function join(base: string, seg: string): string {
  return base.endsWith("/") ? base + seg : base + "/" + seg;
}

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname.startsWith("/api/")) {
    return await handleProjects(req, url);
  }

  const staticResp = await serveStatic(url);
  if (staticResp) return staticResp;

  return new Response("Not Found", { status: 404 });
}

async function runNpm(args: string[]): Promise<void> {
  const cmd = new Deno.Command("npm", { args, cwd: "client" });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    const errText = new TextDecoder().decode(stderr);
    const outText = new TextDecoder().decode(stdout);
    throw new Error(`npm ${args.join(" ")} failed: ${errText || outText}`);
  }
}

async function main() {
  console.log("Motion Maker — checking prerequisites...");

  const ffmpegOk = await checkFfmpeg();
  if (!ffmpegOk) {
    console.error(
      "ERROR: ffmpeg is required but not found on PATH.",
    );
    console.error("Please install ffmpeg (https://ffmpeg.org) and try again.");
    Deno.exit(1);
  }
  console.log("  ffmpeg: found");

  try {
    await Deno.stat("client/node_modules");
    console.log("  frontend dependencies: found");
  } catch {
    console.log("  installing frontend dependencies...");
    await runNpm(["install"]);
  }

  try {
    await Deno.stat("client/dist/index.html");
    console.log("  frontend build: found");
  } catch {
    console.log("  building frontend...");
    await runNpm(["run", "build"]);
  }

  await Deno.mkdir("server/projects", { recursive: true });

  console.log(`Starting Motion Maker on http://localhost:${PORT}`);
  Deno.serve({ port: PORT }, handle);
}

main();
