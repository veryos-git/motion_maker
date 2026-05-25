// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
import { ref, type Ref, onUnmounted } from "vue";

export interface DragResizeState {
  x: Ref<number>;
  y: Ref<number>;
  width: Ref<number>;
  height: Ref<number>;
  isDragging: Ref<boolean>;
  isResizing: Ref<boolean>;
  resizeDir: Ref<string>;
  onDragStart: (e: MouseEvent) => void;
  onResizeStart: (e: MouseEvent, dir: string) => void;
}

export function useDragResize(
  initialX = 100,
  initialY = 80,
  initialW = 420,
  initialH = 340,
): DragResizeState {
  const x = ref(initialX);
  const y = ref(initialY);
  const width = ref(initialW);
  const height = ref(initialH);
  const isDragging = ref(false);
  const isResizing = ref(false);
  const resizeDir = ref("");

  let startX = 0;
  let startY = 0;
  let origX = 0;
  let origY = 0;
  let origW = 0;
  let origH = 0;

  function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  function onDragStart(e: MouseEvent) {
    isDragging.value = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = x.value;
    origY = y.value;

    function onMove(ev: MouseEvent) {
      x.value = clamp(origX + (ev.clientX - startX), 0, window.innerWidth - 50);
      y.value = clamp(origY + (ev.clientY - startY), 0, window.innerHeight - 40);
    }

    function onUp() {
      isDragging.value = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function onResizeStart(e: MouseEvent, dir: string) {
    e.preventDefault();
    e.stopPropagation();
    isResizing.value = true;
    resizeDir.value = dir;
    startX = e.clientX;
    startY = e.clientY;
    origX = x.value;
    origY = y.value;
    origW = width.value;
    origH = height.value;

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (dir.includes("e")) {
        width.value = Math.max(240, origW + dx);
      }
      if (dir.includes("s")) {
        height.value = Math.max(160, origH + dy);
      }
      if (dir.includes("w")) {
        const nw = Math.max(240, origW - dx);
        x.value = clamp(origX + (origW - nw), 0, window.innerWidth - 50);
        width.value = nw;
      }
      if (dir.includes("n")) {
        const nh = Math.max(160, origH - dy);
        y.value = clamp(origY + (origH - nh), 0, window.innerHeight - 40);
        height.value = nh;
      }
    }

    function onUp() {
      isResizing.value = false;
      resizeDir.value = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return { x, y, width, height, isDragging, isResizing, resizeDir, onDragStart, onResizeStart };
}
