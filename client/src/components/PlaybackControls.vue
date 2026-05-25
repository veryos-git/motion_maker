// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
<script setup lang="ts">
const props = defineProps<{
  fps: number;
  frameCount: number;
  currentFrame: number;
  isPlaying: boolean;
}>();

const emit = defineEmits<{
  "update:fps": [value: number];
  play: [];
  pause: [];
  toggle: [];
  seek: [index: number];
}>();

const fpsOptions = [1, 2, 4, 6, 8, 10, 12, 15, 24, 30];

function setFps(v: number) {
  emit("update:fps", Math.max(1, Math.min(60, v)));
}
</script>

<template>
  <div class="playback-controls">
    <div class="pc-row">
      <span class="pc-label">FPS</span>
      <select :value="fps" @change="setFps(Number(($event.target as HTMLSelectElement).value))" class="pc-select">
        <option v-for="o in fpsOptions" :key="o" :value="o">{{ o }}</option>
      </select>
      <input
        type="number"
        :value="fps"
        @input="setFps(Number(($event.target as HTMLInputElement).value))"
        min="1"
        max="60"
        class="pc-fps-input"
      />
    </div>

    <div class="pc-row">
      <button class="pc-btn" @click="emit('toggle')">
        {{ isPlaying ? "⏸ Pause" : "▶ Play" }}
      </button>
      <span class="pc-info">
        Frame {{ frameCount ? currentFrame + 1 : 0 }} / {{ frameCount }}
      </span>
    </div>

    <div class="pc-row">
      <input
        type="range"
        :min="0"
        :max="frameCount - 1"
        :value="currentFrame"
        @input="emit('seek', Number(($event.target as HTMLInputElement).value))"
        class="pc-scrubber"
        :disabled="frameCount < 2"
      />
    </div>
  </div>
</template>

<style scoped>
.playback-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pc-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pc-label {
  font-size: 12px;
  color: #a0a0a0;
  min-width: 28px;
}
.pc-select {
  background: #1a2744;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
}
.pc-fps-input {
  background: #1a2744;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 4px 8px;
  width: 60px;
  font-size: 13px;
}
.pc-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.pc-btn:hover { background: #1d4ed8; }
.pc-info {
  font-size: 12px;
  color: #808080;
}
.pc-scrubber {
  flex: 1;
  accent-color: #2563eb;
  height: 4px;
}
</style>
