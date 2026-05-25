// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
<script setup lang="ts">
import { computed } from "vue";

interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

const props = defineProps<{
  crop: Crop | null;
}>();

const emit = defineEmits<{
  "update:crop": [crop: Crop | null];
  reset: [];
}>();

const cropVal = computed(() => props.crop || { x: 0, y: 0, width: 640, height: 480 });

function updateField(field: keyof Crop, value: number) {
  const c = { ...cropVal.value, [field]: Math.max(1, Math.round(value)) };
  emit("update:crop", c);
}
</script>

<template>
  <div class="crop-tool">
    <p class="crop-hint">Set the crop region to apply to all frames.</p>
    <div class="crop-grid">
      <div class="crop-field">
        <label>X</label>
        <input type="number" :value="cropVal.x" @input="updateField('x', Number(($event.target as HTMLInputElement).value))" min="0" />
      </div>
      <div class="crop-field">
        <label>Y</label>
        <input type="number" :value="cropVal.y" @input="updateField('y', Number(($event.target as HTMLInputElement).value))" min="0" />
      </div>
      <div class="crop-field">
        <label>Width</label>
        <input type="number" :value="cropVal.width" @input="updateField('width', Number(($event.target as HTMLInputElement).value))" min="1" />
      </div>
      <div class="crop-field">
        <label>Height</label>
        <input type="number" :value="cropVal.height" @input="updateField('height', Number(($event.target as HTMLInputElement).value))" min="1" />
      </div>
    </div>
    <button v-if="props.crop" class="crop-reset" @click="emit('reset')">Clear Crop</button>
    <p v-if="!props.crop" class="crop-none">No crop applied (full frame).</p>
    <p class="crop-note">Enter values above to define the crop region. The preview canvas shows the crop overlay.</p>
  </div>
</template>

<style scoped>
.crop-tool {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.crop-hint {
  font-size: 12px;
  color: #808080;
}
.crop-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.crop-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.crop-field label {
  font-size: 11px;
  color: #a0a0a0;
}
.crop-field input {
  background: #1a2744;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 13px;
  width: 100%;
}
.crop-reset {
  align-self: flex-start;
  background: transparent;
  border: 1px solid #444;
  color: #e05555;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.crop-reset:hover { border-color: #e05555; }
.crop-none { font-size: 12px; color: #606060; }
.crop-note { font-size: 11px; color: #505050; margin-top: 4px; }
</style>
