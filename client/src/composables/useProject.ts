// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
import { ref, computed } from "vue";
import * as api from "../api/index";
import type { Project, Frame } from "../api/index";

const STORAGE_KEY = "motion_maker_project_id";

export function useProject() {
  const project = ref<Project | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const previewUrl = ref<string | null>(null);
  const exportUrl = ref<string | null>(null);
  const frameCache = new Map<string, HTMLImageElement>();

  const frames = computed<Frame[]>(() => {
    if (!project.value) return [];
    return [...project.value.frames].sort((a, b) => a.order - b.order);
  });

  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  async function getFrameImage(frameId: string): Promise<HTMLImageElement | null> {
    if (!project.value) return null;
    if (frameCache.has(frameId)) return frameCache.get(frameId)!;
    try {
      const url = api.frameDataUrl(project.value.id, frameId);
      const img = await loadImage(url);
      frameCache.set(frameId, img);
      return img;
    } catch {
      return null;
    }
  }

  function clearFrameCache() {
    frameCache.clear();
  }

  async function initProject(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        try {
          project.value = await api.getProject(savedId);
          return;
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      project.value = await api.createProject();
      localStorage.setItem(STORAGE_KEY, project.value!.id);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to initialize project";
    } finally {
      loading.value = false;
    }
  }

  async function uploadFrames(files: File[]): Promise<void> {
    if (!project.value) return;
    loading.value = true;
    error.value = null;
    try {
      const newFrames = await api.uploadFrames(project.value.id, files);
      project.value.frames.push(...newFrames);
      clearFrameCache();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Upload failed";
    } finally {
      loading.value = false;
    }
  }

  async function removeFrame(frameId: string): Promise<void> {
    if (!project.value) return;
    try {
      await api.deleteFrame(project.value.id, frameId);
      project.value.frames = project.value.frames.filter((f) => f.id !== frameId);
      frameCache.delete(frameId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Delete failed";
    }
  }

  async function reorder(frameIds: string[]): Promise<void> {
    if (!project.value) return;
    try {
      await api.reorderFrames(project.value.id, frameIds);
      const map = new Map(project.value.frames.map((f) => [f.id, f]));
      project.value.frames = frameIds.map((id, i) => {
        const f = map.get(id)!;
        f.order = i;
        return f;
      });
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Reorder failed";
    }
  }

  async function update(settings: Partial<Pick<Project, "fps" | "crop" | "adjustments" | "gifSettings">>): Promise<void> {
    if (!project.value) return;
    try {
      const updated = await api.updateSettings(project.value.id, settings);
      project.value = updated;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Update failed";
    }
  }

  async function generatePreview(): Promise<void> {
    if (!project.value) return;
    loading.value = true;
    try {
      const result = await api.generatePreview(project.value.id);
      previewUrl.value = result.url;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Preview generation failed";
    } finally {
      loading.value = false;
    }
  }

  async function doExport(): Promise<void> {
    if (!project.value) return;
    loading.value = true;
    try {
      const result = await api.exportGif(project.value.id);
      exportUrl.value = result.url;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Export failed";
    } finally {
      loading.value = false;
    }
  }

  return {
    project,
    frames,
    loading,
    error,
    previewUrl,
    exportUrl,
    initProject,
    uploadFrames,
    removeFrame,
    reorder,
    update,
    generatePreview,
    doExport,
    getFrameImage,
    clearFrameCache,
  };
}
