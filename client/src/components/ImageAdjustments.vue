// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
<script setup lang="ts">
defineProps<{
  brightness: number;
  contrast: number;
  shadows: number;
  highlights: number;
}>();

const emit = defineEmits<{
  "update:brightness": [value: number];
  "update:contrast": [value: number];
  "update:shadows": [value: number];
  "update:highlights": [value: number];
  reset: [];
}>();
</script>

<template>
  <div class="image-adjustments">
    <div class="adj-row">
      <label class="adj-label">Brightness</label>
      <span class="adj-val">{{ brightness.toFixed(2) }}</span>
      <input
        type="range" min="-1" max="1" step="0.01"
        :value="brightness"
        @input="emit('update:brightness', Number(($event.target as HTMLInputElement).value))"
        class="adj-slider"
      />
    </div>
    <div class="adj-row">
      <label class="adj-label">Contrast</label>
      <span class="adj-val">{{ contrast.toFixed(2) }}</span>
      <input
        type="range" min="0" max="3" step="0.01"
        :value="contrast"
        @input="emit('update:contrast', Number(($event.target as HTMLInputElement).value))"
        class="adj-slider"
      />
    </div>
    <div class="adj-row">
      <label class="adj-label">Shadows</label>
      <span class="adj-val">{{ shadows.toFixed(2) }}</span>
      <input
        type="range" min="-1" max="1" step="0.01"
        :value="shadows"
        @input="emit('update:shadows', Number(($event.target as HTMLInputElement).value))"
        class="adj-slider"
      />
    </div>
    <div class="adj-row">
      <label class="adj-label">Highlights</label>
      <span class="adj-val">{{ highlights.toFixed(2) }}</span>
      <input
        type="range" min="-1" max="1" step="0.01"
        :value="highlights"
        @input="emit('update:highlights', Number(($event.target as HTMLInputElement).value))"
        class="adj-slider"
      />
    </div>
    <button class="adj-reset" @click="emit('reset')">Reset All</button>
  </div>
</template>

<style scoped>
.image-adjustments {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.adj-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.adj-label {
  font-size: 12px;
  color: #a0a0a0;
  min-width: 72px;
}
.adj-val {
  font-size: 11px;
  color: #808080;
  min-width: 42px;
  text-align: right;
  font-family: monospace;
}
.adj-slider {
  flex: 1;
  accent-color: #2563eb;
}
.adj-reset {
  align-self: flex-start;
  background: transparent;
  border: 1px solid #444;
  color: #a0a0a0;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.adj-reset:hover { border-color: #666; color: #fff; }
</style>
