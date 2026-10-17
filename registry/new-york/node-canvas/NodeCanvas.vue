<script setup lang="ts">
  import { computed, ref, useTemplateRef, watch } from 'vue';
  import { useElementSize, useEventListener } from '@vueuse/core';
  import NodeCanvasEdges from './NodeCanvasEdges.vue';
  import NodeCanvasFrame from './NodeCanvasFrame.vue';
  import NodeCanvasMinimap from './NodeCanvasMinimap.vue';
  import NodeCanvasZoom from './NodeCanvasZoom.vue';
  import { anchorPoint, bezierPath, clamp } from './node-canvas-geometry';
  import type {
    NodeCanvasEdgePath,
    NodeCanvasMinimapItem,
    NodeCanvasNode,
    NodeCanvasNodeSlotProps,
    NodeCanvasPoint,
    NodeCanvasProps,
    NodeCanvasRect,
  } from './types';

  const props = withDefaults(defineProps<NodeCanvasProps>(), {
    edges: () => [],
    breadcrumb: () => [],
    gridSize: 24,
    minZoom: 0.25,
    maxZoom: 2,
    zoomStep: 0.1,
    minimap: true,
    ariaLabel: 'Canvas',
    class: '',
  });

  const emit = defineEmits<{
    nodeMove: [id: string, position: NodeCanvasPoint];
    /** A click on empty canvas, in canvas units. Use it to place new nodes. */
    canvasClick: [point: NodeCanvasPoint];
    nodeResize: [id: string, rect: NodeCanvasRect];
    /** Delete or Backspace on the selected node. Remove it from `nodes` to delete it. */
    nodeDelete: [id: string];
  }>();

  defineSlots<
    {
      toolbar?: () => unknown;
      actions?: () => unknown;
      'selection-toolbar'?: (props: NodeCanvasNodeSlotProps) => unknown;
      /** Fallback body for nodes without their own `#node-<id>` slot. */
      node?: (props: NodeCanvasNodeSlotProps) => unknown;
    } & Record<`node-${string}`, (props: NodeCanvasNodeSlotProps) => unknown>
  >();

  const zoom = defineModel<number>('zoom', { default: 1 });
  const selected = defineModel<string | null>('selected', { default: null });

  const viewport = useTemplateRef<HTMLDivElement>('viewport');
  const { width: viewWidth, height: viewHeight } = useElementSize(viewport);

  const pan = ref<NodeCanvasPoint>({ x: 0, y: 0 });
  // Live geometry per node. Dragging and resizing update it; nodes added later
  // start from their own x/y/width/height, and nodes already on the canvas keep
  // where the user put them.
  const rects = ref<Record<string, NodeCanvasRect>>({});

  watch(
    () => props.nodes,
    (nodes) => {
      const next: Record<string, NodeCanvasRect> = {};
      for (const node of nodes) {
        next[node.id] = rects.value[node.id] ?? {
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
        };
      }
      rects.value = next;
    },
    { immediate: true },
  );

  function rectOf(node: NodeCanvasNode): NodeCanvasRect {
    return (
      rects.value[node.id] ?? {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
      }
    );
  }

  const byId = computed(() => {
    const map = new Map<string, NodeCanvasNode>();
    for (const node of props.nodes) map.set(node.id, node);
    return map;
  });

  const edgePaths = computed<NodeCanvasEdgePath[]>(() => {
    const paths: NodeCanvasEdgePath[] = [];
    for (const edge of props.edges) {
      const from = byId.value.get(edge.from);
      const to = byId.value.get(edge.to);
      if (!from || !to) continue;
      const fromAnchor = edge.fromAnchor ?? { side: 'right' };
      const toAnchor = edge.toAnchor ?? { side: 'left' };
      const start = anchorPoint(rectOf(from), fromAnchor);
      const end = anchorPoint(rectOf(to), toAnchor);
      paths.push({
        id: edge.id,
        d: bezierPath(start, fromAnchor.side, end, toAnchor.side),
        variant: edge.variant ?? 'solid',
        arrow: edge.arrow ?? false,
        start,
        end,
      });
    }
    return paths;
  });

  const MINIMAP_FALLBACK =
    'color-mix(in oklab, var(--muted-foreground) 55%, transparent)';

  const minimapItems = computed<NodeCanvasMinimapItem[]>(() =>
    props.nodes.map((node) => ({
      id: node.id,
      color: node.minimapColor ?? MINIMAP_FALLBACK,
      ...rectOf(node),
    })),
  );

  const viewRect = computed<NodeCanvasRect>(() => ({
    x: -pan.value.x / zoom.value,
    y: -pan.value.y / zoom.value,
    width: Math.max(1, viewWidth.value) / zoom.value,
    height: Math.max(1, viewHeight.value) / zoom.value,
  }));

  const worldStyle = computed(() => ({
    transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
  }));

  const gridStyle = computed(() => {
    const size = props.gridSize * zoom.value;
    return {
      backgroundImage:
        'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${pan.value.x}px ${pan.value.y}px`,
    };
  });

  const selectedNode = computed(() =>
    selected.value ? byId.value.get(selected.value) : undefined,
  );

  const SELECTION_ROOM = 56;

  const selectionStyle = computed(() => {
    const node = selectedNode.value;
    if (!node) return undefined;
    const p = rectOf(node);
    const top = p.y * zoom.value + pan.value.y;
    const left = `${(p.x + p.width) * zoom.value + pan.value.x}px`;
    // Flip below the node when there is no room above it, so the toolbar never
    // slides under the header.
    if (top < SELECTION_ROOM) {
      return {
        left,
        top: `${(p.y + p.height) * zoom.value + pan.value.y}px`,
        translate: '-100% 10px',
      };
    }
    return { left, top: `${top}px`, translate: '-100% calc(-100% - 10px)' };
  });

  /* ---------- zoom ---------- */

  function zoomTo(next: number, around: NodeCanvasPoint): void {
    const z = clamp(Math.round(next * 100) / 100, props.minZoom, props.maxZoom);
    const ratio = z / zoom.value;
    pan.value = {
      x: around.x - (around.x - pan.value.x) * ratio,
      y: around.y - (around.y - pan.value.y) * ratio,
    };
    zoom.value = z;
  }

  function center(): NodeCanvasPoint {
    return { x: viewWidth.value / 2, y: viewHeight.value / 2 };
  }

  function zoomIn(): void {
    zoomTo(zoom.value + props.zoomStep, center());
  }

  function zoomOut(): void {
    zoomTo(zoom.value - props.zoomStep, center());
  }

  function zoomReset(): void {
    zoomTo(1, center());
  }

  function onWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    const el = viewport.value;
    if (!el) return;
    event.preventDefault();
    const box = el.getBoundingClientRect();
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    zoomTo(zoom.value * Math.exp(-delta * 0.002), {
      x: event.clientX - box.left,
      y: event.clientY - box.top,
    });
  }

  useEventListener(viewport, 'wheel', onWheel, { passive: false });

  function navigate(point: NodeCanvasPoint): void {
    pan.value = {
      x: viewWidth.value / 2 - point.x * zoom.value,
      y: viewHeight.value / 2 - point.y * zoom.value,
    };
  }

  /* ---------- pan ---------- */

  let panOrigin: { pointer: NodeCanvasPoint; pan: NodeCanvasPoint } | null =
    null;
  let panMoved = false;
  const panning = ref(false);

  function onPanStart(event: PointerEvent): void {
    if (event.button !== 0 && event.button !== 1) return;
    panOrigin = {
      pointer: { x: event.clientX, y: event.clientY },
      pan: { ...pan.value },
    };
    panMoved = false;
    panning.value = true;
    viewport.value?.setPointerCapture(event.pointerId);
  }

  function onPanMove(event: PointerEvent): void {
    if (!panOrigin) return;
    const dx = event.clientX - panOrigin.pointer.x;
    const dy = event.clientY - panOrigin.pointer.y;
    if (Math.hypot(dx, dy) > 3) panMoved = true;
    pan.value = { x: panOrigin.pan.x + dx, y: panOrigin.pan.y + dy };
  }

  function onPanEnd(event: PointerEvent): void {
    const el = viewport.value;
    if (panOrigin && !panMoved && el && event.type === 'pointerup') {
      selected.value = null;
      const box = el.getBoundingClientRect();
      emit('canvasClick', {
        x: (event.clientX - box.left - pan.value.x) / zoom.value,
        y: (event.clientY - box.top - pan.value.y) / zoom.value,
      });
    }
    panOrigin = null;
    panning.value = false;
  }

  /* ---------- nodes ---------- */

  function onSelect(id: string): void {
    selected.value = id;
  }

  function onMove(id: string, position: NodeCanvasPoint): void {
    const current = rects.value[id];
    if (!current) return;
    rects.value = { ...rects.value, [id]: { ...current, ...position } };
    emit('nodeMove', id, position);
  }

  function onResize(id: string, rect: NodeCanvasRect): void {
    rects.value = { ...rects.value, [id]: rect };
    emit('nodeResize', id, rect);
  }

  const PAN_KEYS: Record<string, NodeCanvasPoint> = {
    ArrowLeft: { x: 40, y: 0 },
    ArrowRight: { x: -40, y: 0 },
    ArrowUp: { x: 0, y: 40 },
    ArrowDown: { x: 0, y: -40 },
  };

  function onKeydown(event: KeyboardEvent): void {
    if (
      event.target instanceof Element &&
      event.target.closest('input, textarea, select, [contenteditable]')
    ) {
      return;
    }
    if (event.key === 'Escape') {
      selected.value = null;
      return;
    }
    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      selectedNode.value &&
      !selectedNode.value.locked
    ) {
      event.preventDefault();
      emit('nodeDelete', selectedNode.value.id);
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomIn();
      return;
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      zoomOut();
      return;
    }
    const delta = PAN_KEYS[event.key];
    if (delta && event.target === event.currentTarget) {
      event.preventDefault();
      pan.value = { x: pan.value.x + delta.x, y: pan.value.y + delta.y };
    }
  }
</script>

<template>
  <div
    :class="[
      'flex w-full flex-col rounded-[28px] border bg-card p-2 text-card-foreground shadow-xl',
      props.class,
    ]"
  >
    <header class="flex min-h-14 flex-wrap items-center gap-3 py-2 pr-1.5 pl-3">
      <nav aria-label="Breadcrumb" class="min-w-0">
        <ol class="flex items-center gap-2.5 text-[15px] whitespace-nowrap">
          <li
            v-for="(crumb, i) in props.breadcrumb"
            :key="crumb"
            class="flex items-center gap-2.5"
          >
            <span
              v-if="i > 0"
              aria-hidden="true"
              class="text-muted-foreground/60"
              >/</span
            >
            <span
              :aria-current="
                i === props.breadcrumb.length - 1 ? 'page' : undefined
              "
              :class="
                i === props.breadcrumb.length - 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              "
            >
              {{ crumb }}
            </span>
          </li>
        </ol>
      </nav>
      <div class="ml-auto flex items-center gap-2">
        <slot name="toolbar" />
        <slot name="actions" />
      </div>
    </header>

    <div
      ref="viewport"
      data-viewport
      role="application"
      aria-roledescription="canvas"
      :aria-label="`${props.ariaLabel}. Drag to pan, Ctrl or Command plus scroll to zoom, plus and minus keys to zoom, arrow keys move the focused node.`"
      tabindex="0"
      :class="[
        'relative h-103 touch-none overflow-hidden rounded-[20px] bg-muted/60 outline-none focus-visible:outline-2 focus-visible:outline-ring dark:bg-muted/45',
        panning ? 'cursor-grabbing' : 'cursor-default',
      ]"
      @pointerdown="onPanStart"
      @pointermove="onPanMove"
      @pointerup="onPanEnd"
      @pointercancel="onPanEnd"
      @keydown="onKeydown"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 text-foreground/6"
        :style="gridStyle"
      />

      <div
        data-world
        class="absolute top-0 left-0 origin-top-left"
        :style="worldStyle"
      >
        <NodeCanvasEdges :paths="edgePaths" />
        <NodeCanvasFrame
          v-for="node in props.nodes"
          :key="node.id"
          :node="node"
          :rect="rectOf(node)"
          :selected="selected === node.id"
          :zoom="zoom"
          @select="onSelect"
          @move="onMove"
          @resize="onResize"
        >
          <slot
            :name="`node-${node.id}`"
            :node="node"
            :selected="selected === node.id"
          >
            <slot name="node" :node="node" :selected="selected === node.id">
              <div
                class="grid size-full place-items-center rounded-3xl border bg-card px-4 text-sm"
              >
                {{ node.label }}
              </div>
            </slot>
          </slot>
        </NodeCanvasFrame>
      </div>

      <div
        v-if="selectedNode && selectionStyle && $slots['selection-toolbar']"
        data-selection-toolbar
        class="absolute z-30"
        :style="selectionStyle"
        @pointerdown.stop
      >
        <slot name="selection-toolbar" :node="selectedNode" :selected="true" />
      </div>

      <NodeCanvasMinimap
        v-if="props.minimap"
        class="absolute top-2.5 right-2.5 z-30"
        :items="minimapItems"
        :viewport="viewRect"
        @navigate="navigate"
      />

      <NodeCanvasZoom
        class="absolute bottom-3 left-3 z-30"
        :zoom="zoom"
        :min-zoom="props.minZoom"
        :max-zoom="props.maxZoom"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @reset="zoomReset"
      />
    </div>
  </div>
</template>
