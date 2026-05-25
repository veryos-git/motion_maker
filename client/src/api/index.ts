// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52

const BASE = "/api";

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

export interface Frame {
  id: string;
  filename: string;
  order: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export function createProject(name?: string): Promise<Project> {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getProject(id: string): Promise<Project> {
  return request<Project>(`/projects/${id}`);
}

export function updateSettings(
  id: string,
  settings: Partial<
    Pick<Project, "fps" | "crop" | "adjustments" | "gifSettings" | "name">
  >,
): Promise<Project> {
  return request<Project>(`/projects/${id}/settings`, {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export function deleteFrame(projectId: string, frameId: string): Promise<void> {
  return request(`/projects/${projectId}/frames/${frameId}`, {
    method: "DELETE",
  });
}

export function reorderFrames(
  projectId: string,
  frameIds: string[],
): Promise<void> {
  return request(`/projects/${projectId}/frames/reorder`, {
    method: "PUT",
    body: JSON.stringify({ frameIds }),
  });
}

export async function uploadFrames(
  projectId: string,
  files: File[],
): Promise<Frame[]> {
  const form = new FormData();
  for (const f of files) form.append("frames", f);

  const res = await fetch(`${BASE}/projects/${projectId}/frames`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data as Frame[];
}

export function generatePreview(projectId: string): Promise<{ url: string }> {
  return request(`/projects/${projectId}/preview`, { method: "POST" });
}

export function exportGif(projectId: string): Promise<{ url: string }> {
  return request(`/projects/${projectId}/export`, { method: "POST" });
}

export function frameDataUrl(projectId: string, frameId: string): string {
  return `${BASE}/projects/${projectId}/frames/data/${frameId}`;
}
