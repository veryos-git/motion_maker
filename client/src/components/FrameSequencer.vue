// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
<script setup lang="ts">
import { ref } from "vue";
import type { Frame } from "../api/index";

const props = defineProps<{
  frames: Frame[];
  loading: boolean;
}>();

const emit = defineEmits<{
  upload: [files: File[]];
  delete: [frameId: string];
  reorder: [frameIds: string[]];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const dragIndex = ref<number | null>(null);

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length) {
    emit("upload", Array.from(input.files));
    input.value = "";
  }
}

function onDragStart(idx: number, e: DragEvent) {
  dragIndex.value = idx;
  e.dataTransfer!.effectAllowed = "move";
}

function onDragOver(idx: number, e: DragEvent) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = "move";
}

function onDrop(idx: number) {
  if (dragIndex.value === null || dragIndex.value === idx) {
    dragIndex.value = null;
    return;
  }
  const ids = props.frames.map((f) => f.id);
  const [moved] = ids.splice(dragIndex.value, 1);
  ids.splice(idx, 0, moved);
  emit("reorder", ids);
  dragIndex.value = null;
}

function moveUp(idx: number) {
  if (idx === 0) return;
  const ids = props.frames.map((f) => f.id);
  [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
  emit("reorder", ids);
}

function moveDown(idx: number) {
  if (idx >= props.frames.length - 1) return;
  const ids = props.frames.map((f) => f.id);
  [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
  emit("reorder", ids);
}
</script>

<template>
  <div class="frame-sequencer">
    <div class="fs-toolbar">
      <button class="btn btn-primary" @click="fileInput?.click()" :disabled="loading">
        + Add Frames
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        @change="onFileChange"
      />
      <span v-if="loading" class="loading-text">Uploading...</span>
    </div>

    <div v-if="!frames.length" class="fs-empty">
      Drop images here or click "Add Frames"
    </div>

    <div class="fs-list" v-else>
      <div
        v-for="(frame, idx) in frames"
        :key="frame.id"
        class="fs-frame"
        :class="{ 'drag-over': dragIndex !== null && dragIndex !== idx }"
        draggable="true"
        @dragstart="onDragStart(idx, $event)"
        @dragover="onDragOver(idx, $event)"
        @drop="onDrop(idx)"
        @dragend="dragIndex = null"
      >
        <span class="fs-num">{{ idx + 1 }}</span>
        <span class="fs-name">{{ frame.filename }}</span>
        <div class="fs-actions">
          <button class="btn-icon" @click="moveUp(idx)" :disabled="idx === 0" title="Move up">▲</button>
          <button class="btn-icon" @click="moveDown(idx)" :disabled="idx >= frames.length - 1" title="Move down">▼</button>
          <button class="btn-icon btn-danger" @click="emit('delete', frame.id)" title="Delete">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.frame-sequencer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fs-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn {
  padding: 5px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #fff;
}
.btn-primary { background: #2563eb; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { background: #444; cursor: not-allowed; }
.btn-icon {
  background: transparent;
  border: 1px solid #333;
  color: #a0a0a0;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 5px;
  line-height: 1;
}
.btn-icon:hover { color: #fff; border-color: #555; }
.btn-danger:hover { color: #e05555; border-color: #e05555; }
.loading-text { font-size: 12px; color: #a0a0a0; }
.fs-empty {
  color: #606060;
  font-size: 13px;
  text-align: center;
  padding: 20px;
  border: 1px dashed #333;
  border-radius: 6px;
}
.fs-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 260px;
  overflow-y: auto;
}
.fs-frame {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  background: #1a2744;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: border-color 0.15s;
  cursor: grab;
}
.fs-frame:hover { border-color: #3460a0; }
.fs-frame.drag-over { border-color: #00e5ff; }
.fs-num {
  font-size: 11px;
  color: #606060;
  min-width: 22px;
  text-align: right;
}
.fs-name {
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fs-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
</style>
