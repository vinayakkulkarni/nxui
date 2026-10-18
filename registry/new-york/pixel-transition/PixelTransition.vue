<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { clamp, createPixelEngine } from './pixel-engine';
  import type {
    PixelTransitionEngine,
    PixelTransitionPoint,
    PixelTransitionProps,
    PixelTransitionSettings,
  } from './types';

  const props = withDefaults(defineProps<PixelTransitionProps>(), {
    gridSize: 10,
    pixelColor: '#ffffff',
    mosaic: 0,
    animationStepDuration: 0.4,
    pattern: 'random',
    randomness: 0.3,
    pixelAnimation: 'pop',
    pixelShape: 'square',
    gap: 0,
    fps: 0,
    trigger: 'hover',
    active: undefined,
    once: false,
    aspectRatio: '100%',
    class: '',
  });

  const emit = defineEmits<{
    'update:active': [active: boolean];
  }>();

  const PATTERNS = ['random', 'dither', 'ripple', 'wipe'];
  const ANIMATIONS = ['pop', 'grow', 'fade'];
  const SHAPES = ['square', 'rounded', 'circle'];

  const rootRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const initial = props.active ? 1 : 0;
  const shown = ref(initial);
  const revealed = ref(initial === 1);
  const reducedMotion = usePreferredReducedMotion();

  let engine: PixelTransitionEngine | null = null;
  let pendingPoint: PixelTransitionPoint | null = null;
  let hovering = false;
  let focused = false;
  let pointerType = 'mouse';

  const hover = computed(() => props.trigger !== 'click');

  function settings(): PixelTransitionSettings {
    return {
      gridSize: clamp(Math.round(props.gridSize), 2, 80),
      pixelColor: props.pixelColor,
      mosaic: clamp(props.mosaic, 0, 1),
      duration: Math.max(0.05, props.animationStepDuration),
      pattern: PATTERNS.includes(props.pattern) ? props.pattern : 'random',
      randomness: clamp(props.randomness, 0, 1),
      animation: ANIMATIONS.includes(props.pixelAnimation)
        ? props.pixelAnimation
        : 'pop',
      shape: SHAPES.includes(props.pixelShape) ? props.pixelShape : 'square',
      gap: Math.max(0, props.gap),
      fps: clamp(props.fps, 0, 120),
      once: props.once,
      reduce: reducedMotion.value === 'reduce',
    };
  }

  function setShown(index: number) {
    shown.value = index;
  }

  onMounted(() => {
    if (!rootRef.value || !canvasRef.value) return;
    engine = createPixelEngine(
      rootRef.value,
      canvasRef.value,
      settings,
      setShown,
      initial,
    );
  });

  useResizeObserver(rootRef, () => engine?.resize());

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  watch(
    () => props.active,
    (value) => {
      if (value === undefined) return;
      revealed.value = value;
      engine?.go(value, pendingPoint);
      pendingPoint = null;
    },
  );

  function request(next: boolean, point: PixelTransitionPoint | null) {
    if (!engine || (!next && props.once && engine.goal() === 1)) return;
    if (props.active === undefined) {
      engine.go(next, point);
      revealed.value = engine.goal() === 1;
    } else pendingPoint = point;
    emit('update:active', next);
  }

  function pointOf(event: MouseEvent): PixelTransitionPoint {
    return { x: event.clientX, y: event.clientY };
  }

  function onPointerEnter(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    hovering = true;
    if (hover.value) request(true, pointOf(event));
  }

  function onPointerLeave(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    hovering = false;
    if (hover.value && !focused) request(false, pointOf(event));
  }

  function onPointerDown(event: PointerEvent) {
    pointerType = event.pointerType;
  }

  function onClick(event: MouseEvent) {
    if (hover.value && pointerType !== 'touch') return;
    request(engine?.goal() !== 1, pointOf(event));
  }

  function isInside(event: FocusEvent): boolean {
    const target = event.relatedTarget;
    return target instanceof Node && !!rootRef.value?.contains(target);
  }

  function onFocus(event: FocusEvent) {
    if (!hover.value || isInside(event)) return;
    if (
      !(event.target instanceof Element) ||
      !event.target.matches(':focus-visible')
    )
      return;
    focused = true;
    request(true, null);
  }

  function onBlur(event: FocusEvent) {
    if (!focused || isInside(event)) return;
    focused = false;
    if (!hovering) request(false, null);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (hover.value || event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    request(engine?.goal() !== 1, null);
  }

  const ratio = computed(() => String(props.aspectRatio).trim());
  const padded = computed(() => ratio.value.endsWith('%'));
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn(
        'pixelated-image-card relative isolate w-75 max-w-full overflow-hidden rounded-2xl [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current',
        props.class,
      )
    "
    :style="padded ? undefined : { aspectRatio: ratio }"
    tabindex="0"
    :role="hover ? undefined : 'button'"
    :aria-pressed="hover ? undefined : revealed"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @pointerdown="onPointerDown"
    @click="onClick"
    @focusin="onFocus"
    @focusout="onBlur"
    @keydown="onKeyDown"
  >
    <div v-if="padded" :style="{ paddingTop: ratio }"></div>
    <div
      class="pixelated-image-card__default"
      :style="{ visibility: shown === 0 ? undefined : 'hidden' }"
    >
      <slot name="first"></slot>
    </div>
    <div
      class="pixelated-image-card__active"
      :style="{ visibility: shown === 1 ? undefined : 'hidden' }"
    >
      <slot name="second"></slot>
    </div>
    <canvas
      ref="canvasRef"
      class="pixelated-image-card__pixels"
      aria-hidden="true"
    ></canvas>
  </div>
</template>

<style scoped>
  .pixelated-image-card__default,
  .pixelated-image-card__active {
    position: absolute;
    inset: 0;
  }

  .pixelated-image-card__pixels {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
