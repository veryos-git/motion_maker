// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from "vue";
import OverlayWindow from "./components/OverlayWindow.vue";
import FrameSequencer from "./components/FrameSequencer.vue";
import PlaybackControls from "./components/PlaybackControls.vue";
import ImageAdjustments from "./components/ImageAdjustments.vue";
import CropTool from "./components/CropTool.vue";
import ExportPanel from "./components/ExportPanel.vue";
import { useProject } from "./composables/useProject";
import { useDragResize } from "./composables/useDragResize";

const project = useProject();

const panels = reactive<Record<string, { visible: boolean; minimized: boolean }>>(
  {
    sequencer: { visible: true, minimized: false },
    playback: { visible: true, minimized: false },
    adjustments: { visible: false, minimized: false },
    crop: { visible: false, minimized: false },
    export: { visible: false, minimized: false },
  },
);

const dr = {
  sequencer: useDragResize(20, 70, 400, 380),
  playback: useDragResize(440, 70, 360, 210),
  adjustments: useDragResize(440, 300, 360, 300),
  crop: useDragResize(820, 70, 380, 240),
  export: useDragResize(820, 330, 380, 340),
};

let zCounter = 200;
const pz = reactive<Record<string, number>>({
  sequencer: 100,
  playback: 101,
  adjustments: 102,
  crop: 103,
  export: 104,
});
function bringToFront(p: string) {
  pz[p] = zCounter++;
}

function togglePanel(p: string) {
  panels[p].visible = !panels[p].visible;
  panels[p].minimized = false;
  if (panels[p].visible) bringToFront(p);
}

// Canvas / playback
const canvasRef = ref<HTMLCanvasElement | null>(null);
const currentFrame = ref(0);
const isPlaying = ref(false);
let animId: number | null = null;
let lastTime = 0;
let accumulated = 0;

async function renderFrame() {
  const canvas = canvasRef.value;
  if (!canvas || !project.frames.value.length) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const frame = project.frames.value[currentFrame.value];
  if (!frame) return;

  try {
    const img = await project.getFrameImage(frame.id);
    if (!img) return;

    const parent = canvas.parentElement;
    const maxW = parent ? parent.clientWidth - 20 : img.width;
    const maxH = parent ? parent.clientHeight - 20 : img.height;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    const adj = project.project.value!.adjustments;
    const crop = project.project.value!.crop;

    ctx.filter = `brightness(${1 + adj.brightness}) contrast(${adj.contrast})`;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";

    if (crop && crop.width > 0 && crop.height > 0) {
      const sx = canvas.width / img.width;
      const sy = canvas.height / img.height;
      const cx = crop.x * sx;
      const cy = crop.y * sy;
      const cw = crop.width * sx;
      const ch = crop.height * sy;

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, canvas.width, cy);
      ctx.fillRect(0, cy, cx, ch);
      ctx.fillRect(cx + cw, cy, canvas.width - cx - cw, ch);
      ctx.fillRect(0, cy + ch, canvas.width, canvas.height - cy - ch);

      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(cx, cy, cw, ch);
      ctx.setLineDash([]);
    }
  } catch {
    /* frame image may not have loaded yet */
  }
}

function startPlayback() {
  if (!project.frames.value.length || isPlaying.value) return;
  isPlaying.value = true;
  lastTime = performance.now();
  accumulated = 0;

  function loop(time: number) {
    if (!isPlaying.value) return;
    const delta = time - lastTime;
    lastTime = time;
    accumulated += delta;
    const interval = 1000 / (project.project.value?.fps || 12);
    while (accumulated >= interval) {
      accumulated -= interval;
      currentFrame.value = (currentFrame.value + 1) %
        project.frames.value.length;
    }
    renderFrame();
    animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);
}

function stopPlayback() {
  isPlaying.value = false;
  if (animId !== null) {
    cancelAnimationFrame(animId);
    animId = null;
  }
}

function seekTo(i: number) {
  currentFrame.value = Math.max(
    0,
    Math.min(i, (project.frames.value.length || 1) - 1),
  );
  renderFrame();
}

function togglePlayback() {
  if (isPlaying.value) stopPlayback();
  else startPlayback();
}

function updateAdjustment(key: string, value: number) {
  if (!project.project.value) return;
  project.update({
    adjustments: { ...project.project.value.adjustments, [key]: value },
  });
}

function updateGif(partial: Record<string, unknown>) {
  if (!project.project.value) return;
  project.update({
    gifSettings: { ...project.project.value.gifSettings, ...partial },
  });
}

watch(
  () => project.project.value?.adjustments,
  () => { if (!isPlaying.value) renderFrame(); },
  { deep: true },
);
watch(
  () => project.project.value?.crop,
  () => { if (!isPlaying.value) renderFrame(); },
  { deep: true },
);
watch(
  () => project.frames.value.length,
  () => {
    currentFrame.value = 0;
    renderFrame();
  },
);

onMounted(async () => {
  await project.initProject();
  await nextTick();
  renderFrame();
});

function drProps(name: string) {
  const d = dr[name as keyof typeof dr];
  return {
    x: d.x.value,
    y: d.y.value,
    width: d.width.value,
    height: d.height.value,
    isDragging: d.isDragging.value,
    isResizing: d.isResizing.value,
    resizeDir: d.resizeDir.value,
    onDragStart: d.onDragStart,
    onResizeStart: d.onResizeStart,
    zIndex: pz[name],
  };
}
</script>

<template>
  <div class="app-container">
    <header class="toolbar">
      <span class="logo">Motion Maker</span>
      <nav class="toolbar-btns">
        <button
          v-for="p in ['sequencer', 'playback', 'adjustments', 'crop', 'export']"
          :key="p"
          :class="{ active: panels[p].visible }"
          @click="togglePanel(p)"
        >
          {{ p === 'sequencer' ? 'Frames' : p === 'playback' ? 'Playback' : p === 'adjustments' ? 'Adjust' : p === 'crop' ? 'Crop' : 'Export' }}
        </button>
      </nav>
      <span v-if="project.error.value" class="error-badge">{{
        project.error.value
      }}</span>
    </header>

    <main class="preview-area">
      <div v-if="project.loading.value && !project.frames.value.length" class="status-msg">
        Loading project...
      </div>
      <div v-else-if="!project.frames.value.length" class="status-msg">
        No frames yet. Open <strong>Frames</strong> to upload images.
      </div>
      <canvas ref="canvasRef" class="preview-canvas" />
    </main>

    <OverlayWindow
      title="Frame Sequencer"
      :visible="panels.sequencer.visible"
      :minimized="panels.sequencer.minimized"
      v-bind="drProps('sequencer')"
      @close="panels.sequencer.visible = false"
      @minimize="panels.sequencer.minimized = !panels.sequencer.minimized"
      @bring-front="bringToFront('sequencer')"
    >
      <FrameSequencer
        :frames="project.frames.value"
        :loading="project.loading.value"
        @upload="(files: any) => project.uploadFrames(files)"
        @delete="(id: any) => project.removeFrame(id)"
        @reorder="(ids: any) => project.reorder(ids)"
      />
    </OverlayWindow>

    <OverlayWindow
      title="Playback Controls"
      :visible="panels.playback.visible"
      :minimized="panels.playback.minimized"
      v-bind="drProps('playback')"
      @close="panels.playback.visible = false"
      @minimize="panels.playback.minimized = !panels.playback.minimized"
      @bring-front="bringToFront('playback')"
    >
      <PlaybackControls
        :fps="project.project.value?.fps ?? 12"
        :frame-count="project.frames.value.length"
        :current-frame="currentFrame"
        :is-playing="isPlaying"
        @update:fps="(v: any) => project.update({ fps: Number(v) })"
        @toggle="togglePlayback"
        @seek="seekTo"
      />
    </OverlayWindow>

    <OverlayWindow
      title="Image Adjustments"
      :visible="panels.adjustments.visible"
      :minimized="panels.adjustments.minimized"
      v-bind="drProps('adjustments')"
      @close="panels.adjustments.visible = false"
      @minimize="panels.adjustments.minimized = !panels.adjustments.minimized"
      @bring-front="bringToFront('adjustments')"
    >
      <ImageAdjustments
        :brightness="project.project.value?.adjustments.brightness ?? 0"
        :contrast="project.project.value?.adjustments.contrast ?? 1"
        :shadows="project.project.value?.adjustments.shadows ?? 0"
        :highlights="project.project.value?.adjustments.highlights ?? 0"
        @update:brightness="(v: any) => updateAdjustment('brightness', Number(v))"
        @update:contrast="(v: any) => updateAdjustment('contrast', Number(v))"
        @update:shadows="(v: any) => updateAdjustment('shadows', Number(v))"
        @update:highlights="(v: any) => updateAdjustment('highlights', Number(v))"
        @reset="project.update({ adjustments: { brightness: 0, contrast: 1, shadows: 0, highlights: 0 } })"
      />
    </OverlayWindow>

    <OverlayWindow
      title="Crop Tool"
      :visible="panels.crop.visible"
      :minimized="panels.crop.minimized"
      v-bind="drProps('crop')"
      @close="panels.crop.visible = false"
      @minimize="panels.crop.minimized = !panels.crop.minimized"
      @bring-front="bringToFront('crop')"
    >
      <CropTool
        :crop="project.project.value?.crop ?? null"
        @update:crop="(c: any) => project.update({ crop: c })"
        @reset="project.update({ crop: null })"
      />
    </OverlayWindow>

    <OverlayWindow
      title="Export"
      :visible="panels.export.visible"
      :minimized="panels.export.minimized"
      v-bind="drProps('export')"
      @close="panels.export.visible = false"
      @minimize="panels.export.minimized = !panels.export.minimized"
      @bring-front="bringToFront('export')"
    >
      <ExportPanel
        :gif-settings="project.project.value?.gifSettings ?? { width: 480, height: 270, quality: 80, loop: true }"
        :preview-url="project.previewUrl.value"
        :export-url="project.exportUrl.value"
        :loading="project.loading.value"
        @update:gif-settings="(s: any) => updateGif(s)"
        @generate-preview="project.generatePreview()"
        @export="project.doExport()"
      />
    </OverlayWindow>
  </div>
</template>

<style>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #0f3460;
  border-bottom: 2px solid #16213e;
  flex-shrink: 0;
}

.logo {
  font-weight: 700;
  font-size: 16px;
  color: #e0e0e0;
  margin-right: 12px;
}

.toolbar-btns {
  display: flex;
  gap: 4px;
}

.toolbar-btns button {
  background: transparent;
  border: 1px solid transparent;
  color: #a0a0a0;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}

.toolbar-btns button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.toolbar-btns button.active {
  color: #fff;
  background: #1a3a5c;
  border-color: #3460a0;
}

.error-badge {
  color: #e05555;
  font-size: 12px;
  margin-left: auto;
}

.preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #111122;
  position: relative;
}

.preview-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.status-msg {
  color: #808080;
  font-size: 15px;
  position: absolute;
  pointer-events: none;
}

.status-msg strong {
  color: #00e5ff;
}
</style>
