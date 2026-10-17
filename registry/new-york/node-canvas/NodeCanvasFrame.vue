<script setup lang="ts">
  import { computed, ref } from 'vue';
  import type {
    NodeCanvasCorner,
    NodeCanvasFrameProps,
    NodeCanvasPoint,
    NodeCanvasRect,
  } from './types';

  const props = defineProps<NodeCanvasFrameProps>();

  const emit = defineEmits<{
    select: [id: string];
    move: [id: string, position: NodeCanvasPoint];
    resize: [id: string, rect: NodeCanvasRect];
  }>();

  const DRAG_THRESHOLD = 3;
  const KEY_STEP = 8;
  const HANDLE = 8;
  const CORNERS: {
    id: NodeCanvasCorner;
    class: string;
    translate: string;
    label: string;
  }[] = [
    {
      id: 'nw',
      class: 'top-0 left-0 cursor-nwse-resize',
      translate: '-50% -50%',
      label: 'top left',
    },
    {
      id: 'ne',
      class: 'top-0 right-0 cursor-nesw-resize',
      translate: '50% -50%',
      label: 'top right',
    },
    {
      id: 'sw',
      class: 'bottom-0 left-0 cursor-nesw-resize',
      translate: '-50% 50%',
      label: 'bottom left',
    },
    {
      id: 'se',
      class: 'right-0 bottom-0 cursor-nwse-resize',
      translate: '50% 50%',
      label: 'bottom right',
    },
  ];

  const dragging = ref(false);
  let origin: { pointer: NodeCanvasPoint; position: NodeCanvasPoint } | null =
    null;

  const interactive = computed(() => props.node.interactive !== false);
  const movable = computed(() => interactive.value && !props.node.locked);
  const resizable = computed(
    () => movable.value && props.node.resizable !== false,
  );
  const minWidth = computed(() => props.node.minWidth ?? 80);
  const minHeight = computed(() => props.node.minHeight ?? 48);

  const style = computed(() => ({
    left: `${props.rect.x}px`,
    top: `${props.rect.y}px`,
    width: `${props.rect.width}px`,
    height: `${props.rect.height}px`,
    transform: props.node.rotate ? `rotate(${props.node.rotate}deg)` : '',
  }));

  const radius = computed(() => `${props.node.radius ?? 24}px`);
  const handleSize = computed(() => `${HANDLE / props.zoom}px`);
  const outline = computed(() => `${1.25 / props.zoom}px`);

  function isControl(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      target.closest(
        'button, input, label, a, select, textarea, [data-no-drag]',
      ) !== null
    );
  }

  function onPointerDown(event: PointerEvent): void {
    if (!interactive.value || event.button !== 0) return;
    event.stopPropagation();
    emit('select', props.node.id);
    if (isControl(event.target) || !movable.value) return;
    origin = {
      pointer: { x: event.clientX, y: event.clientY },
      position: { x: props.rect.x, y: props.rect.y },
    };
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (!origin) return;
    const dx = event.clientX - origin.pointer.x;
    const dy = event.clientY - origin.pointer.y;
    if (!dragging.value && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    dragging.value = true;
    emit('move', props.node.id, {
      x: origin.position.x + dx / props.zoom,
      y: origin.position.y + dy / props.zoom,
    });
  }

  function onPointerUp(): void {
    origin = null;
    dragging.value = false;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!interactive.value || event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      emit('select', props.node.id);
      return;
    }
    // Delete acts on the focused node: select it, then let the canvas handle it.
    if (event.key === 'Delete' || event.key === 'Backspace') {
      emit('select', props.node.id);
      return;
    }
    const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    const delta: Record<string, NodeCanvasPoint> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const d = delta[event.key];
    if (!d || !movable.value) return;
    event.preventDefault();
    emit('select', props.node.id);
    emit('move', props.node.id, {
      x: props.rect.x + d.x,
      y: props.rect.y + d.y,
    });
  }

  /* ---------- resize ---------- */

  let resizeOrigin: {
    corner: NodeCanvasCorner;
    pointer: NodeCanvasPoint;
    rect: NodeCanvasRect;
  } | null = null;

  function resized(
    corner: NodeCanvasCorner,
    start: NodeCanvasRect,
    dx: number,
    dy: number,
  ): NodeCanvasRect {
    const west = corner === 'nw' || corner === 'sw';
    const north = corner === 'nw' || corner === 'ne';
    const width = Math.max(minWidth.value, start.width + (west ? -dx : dx));
    const height = Math.max(minHeight.value, start.height + (north ? -dy : dy));
    return {
      x: west ? start.x + start.width - width : start.x,
      y: north ? start.y + start.height - height : start.y,
      width,
      height,
    };
  }

  function onResizeStart(event: PointerEvent, corner: NodeCanvasCorner): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    resizeOrigin = {
      corner,
      pointer: { x: event.clientX, y: event.clientY },
      rect: { ...props.rect },
    };
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function onResizeMove(event: PointerEvent): void {
    if (!resizeOrigin) return;
    event.stopPropagation();
    const dx = (event.clientX - resizeOrigin.pointer.x) / props.zoom;
    const dy = (event.clientY - resizeOrigin.pointer.y) / props.zoom;
    emit(
      'resize',
      props.node.id,
      resized(resizeOrigin.corner, resizeOrigin.rect, dx, dy),
    );
  }

  function onResizeEnd(event: PointerEvent): void {
    if (!resizeOrigin) return;
    event.stopPropagation();
    resizeOrigin = null;
  }

  // Shift + arrow keys on a focused handle resize by one grid step.
  function onResizeKey(event: KeyboardEvent, corner: NodeCanvasCorner): void {
    const step = KEY_STEP;
    const delta: Record<string, NodeCanvasPoint> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const d = delta[event.key];
    if (!d) return;
    event.preventDefault();
    event.stopPropagation();
    emit('resize', props.node.id, resized(corner, props.rect, d.x, d.y));
  }
</script>

<template>
  <div
    role="group"
    aria-roledescription="node"
    :aria-label="props.node.label"
    :aria-current="props.selected ? 'true' : undefined"
    :tabindex="interactive ? 0 : -1"
    :data-node-id="props.node.id"
    :data-selected="props.selected ? '' : undefined"
    :style="style"
    :class="[
      'absolute touch-none outline-none select-none',
      movable ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : '',
      props.selected ? 'z-10' : '',
      'focus-visible:*:data-focus:opacity-100',
    ]"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKeydown"
  >
    <slot />
    <span
      data-focus
      aria-hidden="true"
      class="pointer-events-none absolute -inset-1 opacity-0 outline-2 outline-ring transition-opacity"
      :style="{ borderRadius: radius }"
    />
    <template v-if="props.selected">
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 border-blue-500"
        :style="{ borderRadius: radius, borderWidth: outline }"
      />
      <span
        v-for="corner in CORNERS"
        :key="corner.id"
        :role="resizable ? 'button' : undefined"
        :tabindex="resizable ? 0 : undefined"
        :aria-hidden="resizable ? undefined : 'true'"
        :aria-label="
          resizable ? `Resize from ${corner.label} corner` : undefined
        "
        :data-handle="corner.id"
        :class="[
          'absolute border-blue-500 bg-background outline-none focus-visible:bg-blue-500',
          resizable ? corner.class : 'pointer-events-none',
        ]"
        :style="{
          width: handleSize,
          height: handleSize,
          borderWidth: outline,
          translate: corner.translate,
        }"
        @pointerdown="onResizeStart($event, corner.id)"
        @pointermove="onResizeMove"
        @pointerup="onResizeEnd"
        @pointercancel="onResizeEnd"
        @keydown="onResizeKey($event, corner.id)"
      >
        <!-- Invisible hit area: the drawn square is tiny at low zoom. -->
        <span v-if="resizable" aria-hidden="true" class="absolute -inset-2" />
      </span>
    </template>
  </div>
</template>
