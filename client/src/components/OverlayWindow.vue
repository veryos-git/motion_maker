<!-- license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52 -->
<script lang="ts">
import { defineComponent, h, type PropType } from "vue";

export default defineComponent({
  name: "OverlayWindow",
  props: {
    title: { type: String, required: true },
    x: { type: Number, default: 100 },
    y: { type: Number, default: 80 },
    width: { type: Number, default: 420 },
    height: { type: Number, default: 340 },
    visible: { type: Boolean, default: true },
    minimized: { type: Boolean, default: false },
    zIndex: { type: Number, default: 100 },
    onDragStart: { type: Function as PropType<(e: MouseEvent) => void>, default: null },
    onResizeStart: { type: Function as PropType<(e: MouseEvent, dir: string) => void>, default: null },
    isDragging: { type: Boolean, default: false },
    isResizing: { type: Boolean, default: false },
    resizeDir: { type: String, default: "" },
  },
  emits: ["close", "minimize", "bring-front"],
  setup(props, { slots, emit }) {
    const handleSize = 6;
    const dirs = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

    return () => {
      if (!props.visible) return null;

      const style: Record<string, string> = {
        position: "fixed",
        left: `${props.x}px`,
        top: `${props.y}px`,
        width: props.minimized ? "260px" : `${props.width}px`,
        height: props.minimized ? "auto" : `${props.height}px`,
        zIndex: String(props.zIndex),
        background: "#16213e",
        border: "1px solid #0f3460",
        borderRadius: "6px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: props.isDragging || props.isResizing ? "none" : "auto",
      };

      const titleBarStyle: Record<string, string> = {
        background: "#0f3460",
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "grab",
        flexShrink: "0",
        minHeight: "32px",
      };

      return h("div", {
        style,
        onMousedown: () => emit("bring-front"),
      }, [
        h("div", {
          style: titleBarStyle,
          onMousedown: (e: MouseEvent) => {
            emit("bring-front");
            props.onDragStart?.(e);
          },
        }, [
          h("span", {
            style: { fontSize: "13px", fontWeight: 600, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
          }, props.title),
          h("div", { style: { display: "flex", gap: "4px" } }, [
            h("button", {
              style: { background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "14px", padding: "0 4px", lineHeight: 1 },
              onClick: (e: MouseEvent) => { e.stopPropagation(); emit("minimize"); },
            }, props.minimized ? "□" : "−"),
            h("button", {
              style: { background: "none", border: "none", color: "#e05555", cursor: "pointer", fontSize: "14px", padding: "0 4px", lineHeight: 1 },
              onClick: (e: MouseEvent) => { e.stopPropagation(); emit("close"); },
            }, "×"),
          ]),
        ]),

        props.minimized ? null : h("div", {
          style: { flex: 1, overflow: "auto", padding: "10px", position: "relative" },
        }, [
          slots.default?.(),
          ...dirs.map((dir) => {
            const cursors: Record<string, string> = {
              nw: "nwse-resize", n: "ns-resize", ne: "nesw-resize",
              e: "ew-resize", se: "nwse-resize", s: "ns-resize",
              sw: "nesw-resize", w: "ew-resize",
            };
            const posStyle: Record<string, string> = {
              position: "absolute",
              ...(dir.includes("n") ? { top: "0" } : {}),
              ...(dir.includes("s") ? { bottom: "0" } : {}),
              ...(dir.includes("w") ? { left: "0" } : {}),
              ...(dir.includes("e") ? { right: "0" } : {}),
              ...(dir === "n" || dir === "s" ? { left: "6px", right: "6px", height: `${handleSize}px` } : {}),
              ...(dir === "e" || dir === "w" ? { top: "6px", bottom: "6px", width: `${handleSize}px` } : {}),
              ...(dir.length === 2 && dir !== "n" && dir !== "s" && dir !== "e" && dir !== "w"
                ? { width: `${handleSize + 4}px`, height: `${handleSize + 4}px` }
                : {}),
              cursor: cursors[dir] || "default",
            };
            return h("div", {
              key: dir,
              style: posStyle,
              onMousedown: (e: MouseEvent) => {
                e.stopPropagation();
                props.onResizeStart?.(e, dir);
              },
            });
          }),
        ]),
      ]);
    };
  },
});
</script>
