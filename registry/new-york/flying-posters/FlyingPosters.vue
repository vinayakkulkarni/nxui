<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { POSTER_AXES, clampValue, createPosterEngine } from './poster-engine';
  import type {
    FlyingPostersItem,
    FlyingPostersProps,
    PosterEngine,
    PosterSettings,
  } from './types';

  const props = withDefaults(defineProps<FlyingPostersProps>(), {
    items: () => [],
    planeWidth: 320,
    planeHeight: 320,
    distortion: 3,
    scrollEase: 0.01,
    cameraFov: 45,
    cameraZ: 20,
    gap: undefined,
    columns: 1,
    columnGap: 40,
    alternate: true,
    radius: 0,
    rotation: 180,
    axis: 'vertical',
    speed: 0,
    lean: 0,
    fade: 0,
    shading: 0,
    wheel: true,
    drag: true,
    pageScroll: 0,
    class: '',
  });

  const emit = defineEmits<{
    itemClick: [item: FlyingPostersItem, index: number];
  }>();

  const rootRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const motion = usePreferredReducedMotion();
  let engine: PosterEngine | null = null;

  const settings = computed<PosterSettings>(() => ({
    planeWidth: Math.max(10, props.planeWidth),
    planeHeight: Math.max(10, props.planeHeight),
    distortion: clampValue(props.distortion, 0, 50),
    scrollEase: clampValue(props.scrollEase, 0.001, 1),
    cameraFov: clampValue(props.cameraFov, 10, 120),
    cameraZ: Math.max(1, props.cameraZ),
    gap: props.gap,
    columns: clampValue(Math.round(props.columns), 1, 8),
    columnGap: Math.max(0, props.columnGap),
    alternate: props.alternate,
    radius: Math.max(0, props.radius),
    rotation: props.rotation,
    axis: props.axis in POSTER_AXES ? props.axis : 'vertical',
    speed: props.speed,
    lean: clampValue(props.lean, 0, 2),
    fade: clampValue(props.fade, 0, 1),
    shading: clampValue(props.shading, 0, 1),
    wheel: props.wheel,
    drag: props.drag,
    pageScroll: props.pageScroll,
  }));

  function onItemClick(item: FlyingPostersItem, index: number) {
    emit('itemClick', item, index);
  }

  onMounted(() => {
    const root = rootRef.value;
    const canvas = canvasRef.value;
    if (!root || !canvas) return;
    engine = createPosterEngine({
      root,
      canvas,
      reduced: motion.value === 'reduce',
      settings: () => settings.value,
      items: () => props.items,
      onItemClick,
    });
    engine?.resize();
    engine?.loadItems(props.items);
  });

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });

  watch(
    () => props.items,
    (items) => engine?.loadItems(items),
  );
  watch(settings, () => engine?.wake());

  useResizeObserver(rootRef, () => engine?.resize());
  useIntersectionObserver(rootRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  useEventListener(
    canvasRef,
    'wheel',
    (event: WheelEvent) => engine?.wheel(event),
    {
      passive: false,
    },
  );
  useEventListener(canvasRef, 'pointerdown', (event: PointerEvent) =>
    engine?.pointerDown(event),
  );
  useEventListener(canvasRef, 'pointermove', (event: PointerEvent) =>
    engine?.pointerMove(event),
  );
  useEventListener(canvasRef, 'pointerup', (event: PointerEvent) =>
    engine?.pointerUp(event),
  );
  useEventListener(canvasRef, 'pointercancel', (event: PointerEvent) =>
    engine?.pointerUp(event),
  );
  useEventListener('scroll', () => engine?.pageScroll(), { passive: true });

  const canvasStyle = computed(() => ({
    touchAction: props.drag ? 'none' : 'auto',
    cursor: props.drag ? undefined : 'default',
  }));
</script>

<template>
  <div ref="rootRef" :class="cn('flying-posters', props.class)">
    <canvas
      ref="canvasRef"
      class="flying-posters__canvas"
      role="img"
      aria-label="Poster gallery"
      :style="canvasStyle"
    />
  </div>
</template>

<style scoped>
  .flying-posters {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .flying-posters__canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .flying-posters__canvas:active {
    cursor: grabbing;
  }
</style>
