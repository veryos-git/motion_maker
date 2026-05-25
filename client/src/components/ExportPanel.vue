// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
<script setup lang="ts">
import { computed } from "vue";

interface GifSettings {
  width: number;
  height: number;
  quality: number;
  loop: boolean;
}

const props = defineProps<{
  gifSettings: GifSettings;
  previewUrl: string | null;
  exportUrl: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  "update:gif-settings": [settings: Partial<GifSettings>];
  "generate-preview": [];
  export: [];
}>();

const qualityLabel = computed(() => `${props.gifSettings.quality}%`);

function update(field: keyof GifSettings, value: unknown) {
  emit("update:gif-settings", { [field]: value });
}
</script>

<template>
  <div class="export-panel">
    <h4 class="ep-section">GIF Dimensions</h4>
    <div class="ep-row">
      <div class="ep-field">
        <label>Width</label>
        <input
          type="number" :value="gifSettings.width"
          @input="update('width', Number(($event.target as HTMLInputElement).value))"
          min="32" max="1920" step="2"
        />
      </div>
      <div class="ep-field">
        <label>Height</label>
        <input
          type="number" :value="gifSettings.height"
          @input="update('height', Number(($event.target as HTMLInputElement).value))"
          min="32" max="1920" step="2"
        />
      </div>
    </div>

    <div class="ep-row">
      <label class="ep-label">Quality</label>
      <span class="ep-val">{{ qualityLabel }}</span>
      <input
        type="range" :value="gifSettings.quality" min="10" max="100"
        @input="update('quality', Number(($event.target as HTMLInputElement).value))"
        class="ep-slider"
      />
    </div>

    <label class="ep-check">
      <input
        type="checkbox" :checked="gifSettings.loop"
        @change="update('loop', ($event.target as HTMLInputElement).checked)"
      />
      Loop GIF
    </label>

    <div class="ep-actions">
      <button class="ep-btn ep-btn-preview" :disabled="loading" @click="emit('generate-preview')">
        {{ loading ? "Generating..." : "Generate Preview (MP4)" }}
      </button>
      <button class="ep-btn ep-btn-export" :disabled="loading" @click="emit('export')">
        {{ loading ? "Exporting..." : "Export GIF" }}
      </button>
    </div>

    <div v-if="previewUrl" class="ep-result">
      <p>Preview ready:</p>
      <video :src="previewUrl" controls loop class="ep-video" />
    </div>

    <div v-if="exportUrl" class="ep-result">
      <p>GIF ready:</p>
      <a :href="exportUrl" download class="ep-download">Download GIF</a>
      <img :src="exportUrl" class="ep-gif-preview" />
    </div>
  </div>
</template>

<style scoped>
.export-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ep-section {
  font-size: 12px;
  color: #808080;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ep-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ep-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ep-field label {
  font-size: 11px;
  color: #a0a0a0;
}
.ep-field input {
  background: #1a2744;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 13px;
  width: 80px;
}
.ep-label { font-size: 12px; color: #a0a0a0; min-width: 50px; }
.ep-val { font-size: 11px; color: #808080; min-width: 36px; font-family: monospace; }
.ep-slider { flex: 1; accent-color: #2563eb; }
.ep-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #c0c0c0;
  cursor: pointer;
}
.ep-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ep-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #fff;
}
.ep-btn:disabled { background: #444; cursor: not-allowed; }
.ep-btn-preview { background: #2563eb; }
.ep-btn-preview:hover:not(:disabled) { background: #1d4ed8; }
.ep-btn-export { background: #16a34a; }
.ep-btn-export:hover:not(:disabled) { background: #15803d; }
.ep-result {
  margin-top: 4px;
  padding: 8px;
  background: #1a2744;
  border-radius: 4px;
}
.ep-result p { font-size: 12px; color: #a0a0a0; margin-bottom: 4px; }
.ep-video { width: 100%; max-height: 200px; border-radius: 4px; }
.ep-download {
  display: inline-block;
  padding: 6px 16px;
  background: #16a34a;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 13px;
  margin-bottom: 8px;
}
.ep-download:hover { background: #15803d; }
.ep-gif-preview { width: 100%; border-radius: 4px; image-rendering: auto; }
</style>
