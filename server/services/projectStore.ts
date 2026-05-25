// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
import { join } from "node:path";

export interface Frame {
  id: string;
  filename: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  frames: Frame[];
  fps: number;
  crop: { x: number; y: number; width: number; height: number } | null;
  adjustments: {
    brightness: number;
    contrast: number;
    shadows: number;
    highlights: number;
  };
  gifSettings: {
    width: number;
    height: number;
    quality: number;
    loop: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const PROJECTS_DIR = "server/projects";

function pid(id: string): string {
  return join(PROJECTS_DIR, id);
}
function pjpath(id: string): string {
  return join(pid(id), "project.json");
}
function framesDir(id: string): string {
  return join(pid(id), "frames");
}

function defaultProject(id: string, name: string): Project {
  const now = new Date().toISOString();
  return {
    id,
    name,
    frames: [],
    fps: 12,
    crop: null,
    adjustments: { brightness: 0, contrast: 1, shadows: 0, highlights: 0 },
    gifSettings: { width: 480, height: 270, quality: 80, loop: true },
    createdAt: now,
    updatedAt: now,
  };
}

function genId(): string {
  return crypto.randomUUID();
}

export async function createProject(name = "Untitled"): Promise<Project> {
  const id = genId();
  const project = defaultProject(id, name);
  await Deno.mkdir(framesDir(id), { recursive: true });
  await Deno.writeTextFile(pjpath(id), JSON.stringify(project, null, 2));
  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const data = await Deno.readTextFile(pjpath(id));
    return JSON.parse(data) as Project;
  } catch {
    return null;
  }
}

export async function addFrames(
  projectId: string,
  files: { filename: string; data: Uint8Array }[],
): Promise<Frame[]> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  await Deno.mkdir(framesDir(projectId), { recursive: true });

  const newFrames: Frame[] = [];
  for (const file of files) {
    const id = genId();
    const ext = file.filename.includes(".")
      ? file.filename.substring(file.filename.lastIndexOf("."))
      : ".jpg";
    const storedName = `${id}${ext}`;
    await Deno.writeFile(join(framesDir(projectId), storedName), file.data);
    newFrames.push({
      id,
      filename: storedName,
      order: project.frames.length + newFrames.length,
    });
  }

  project.frames.push(...newFrames);
  project.updatedAt = new Date().toISOString();
  await Deno.writeTextFile(pjpath(projectId), JSON.stringify(project, null, 2));

  return newFrames;
}

export async function deleteFrame(
  projectId: string,
  frameId: string,
): Promise<void> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  const frame = project.frames.find((f) => f.id === frameId);
  if (!frame) throw new Error("Frame not found");

  try {
    await Deno.remove(join(framesDir(projectId), frame.filename));
  } catch { /* file may not exist */ }

  project.frames = project.frames.filter((f) => f.id !== frameId);
  project.frames.forEach((f, i) => (f.order = i));
  project.updatedAt = new Date().toISOString();
  await Deno.writeTextFile(pjpath(projectId), JSON.stringify(project, null, 2));
}

export async function reorderFrames(
  projectId: string,
  frameIds: string[],
): Promise<void> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  const frameMap = new Map(project.frames.map((f) => [f.id, f]));
  project.frames = frameIds
    .map((id, i) => {
      const f = frameMap.get(id);
      if (!f) return null;
      f.order = i;
      return f;
    })
    .filter(Boolean) as Frame[];

  project.updatedAt = new Date().toISOString();
  await Deno.writeTextFile(pjpath(projectId), JSON.stringify(project, null, 2));
}

export async function updateSettings(
  projectId: string,
  settings: Partial<
    Pick<Project, "fps" | "crop" | "adjustments" | "gifSettings" | "name">
  >,
): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  if (settings.name !== undefined) project.name = settings.name;
  if (settings.fps !== undefined) project.fps = settings.fps;
  if (settings.crop !== undefined) project.crop = settings.crop;
  if (settings.adjustments !== undefined) {
    project.adjustments = { ...project.adjustments, ...settings.adjustments };
  }
  if (settings.gifSettings !== undefined) {
    project.gifSettings = { ...project.gifSettings, ...settings.gifSettings };
  }
  project.updatedAt = new Date().toISOString();

  await Deno.writeTextFile(pjpath(projectId), JSON.stringify(project, null, 2));
  return project;
}

export function getFramePath(projectId: string, frame: Frame): string {
  return join(framesDir(projectId), frame.filename);
}

export function getFramesDir(projectId: string): string {
  return framesDir(projectId);
}

export function listProjectIds(): string[] {
  try {
    const entries = Deno.readDirSync(PROJECTS_DIR);
    return Array.from(entries)
      .filter((e) => e.isDirectory)
      .map((e) => e.name);
  } catch {
    return [];
  }
}
