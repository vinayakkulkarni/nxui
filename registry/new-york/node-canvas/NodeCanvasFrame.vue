<script setup lang="ts">
  import { computed, ref } from 'vue';
  import type { NodeCanvasFrameProps, NodeCanvasPoint } from './types';

  const props = defineProps<NodeCanvasFrameProps>();

  const emit = defineEmits<{
    select: [id: string];
    move: [id: string, position: NodeCanvasPoint];
  }>();

  const DRAG_THRESHOLD = 3;
  const KEY_STEP = 8;
  const HANDLE = 8;
  const CORNERS = [
    { class: 'top-0 left-0', translate: '-50% -50%' },
    { class: 'top-0 right-0', translate: '50% -50%' },
    { class: 'bottom-0 left-0', translate: '-50% 50%' },
    { class: 'right-0 bottom-0', translate: '50% 50%' },
  ];

  const dragging = ref(false);
  let origin: { pointer: NodeCanvasPoint; position: NodeCanvasPoint } | null =
    null;

  const interactive = computed(() => props.node.interactive !== false);

  const style = computed(() => ({
    left: `${props.position.x}px`,
    top: `${props.position.y}px`,
    width: `${props.node.width}px`,
    height: `${props.node.height}px`,
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
    if (isControl(event.target)) return;
    origin = {
      pointer: { x: event.clientX, y: event.clientY },
      position: { ...props.position },
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
    const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    const delta: Record<string, NodeCanvasPoint> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const d = delta[event.key];
    if (!d) return;
    event.preventDefault();
    emit('select', props.node.id);
    emit('move', props.node.id, {
      x: props.position.x + d.x,
      y: props.position.y + d.y,
    });
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
      interactive ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : '',
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
        :key="corner.class"
        aria-hidden="true"
        :class="[
          'pointer-events-none absolute border-blue-500 bg-background',
          corner.class,
        ]"
        :style="{
          width: handleSize,
          height: handleSize,
          borderWidth: outline,
          translate: corner.translate,
        }"
      />
    </template>
  </div>
</template>
