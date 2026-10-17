<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { MATERIALS, clamp } from './ballpit-gl';
  import { createBallpitEngine } from './ballpit-engine';
  import type { BallpitEngine, BallpitProps, BallpitSettings } from './types';

  const props = withDefaults(defineProps<BallpitProps>(), {
    count: 200,
    colors: () => ['#ffffff'],
    material: 'satin',
    minSize: 0.5,
    maxSize: 1,
    gravity: 0.5,
    friction: 0.9975,
    wallBounce: 0.95,
    bounce: 0.85,
    depth: 2,
    drift: 0,
    followCursor: true,
    cursorSize: 1,
    grab: true,
    clickEffect: 'burst',
    lightColor: '#ffffff',
    lightIntensity: 1,
    exposure: 1,
    shadows: 0.6,
    intro: true,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: BallpitEngine | null = null;

  const settings = computed<BallpitSettings>(() => ({
    count: Math.round(clamp(props.count, 1, 4000)),
    colors: props.colors.length ? props.colors : ['#ffffff'],
    material: props.material in MATERIALS ? props.material : 'satin',
    minSize: Math.max(0.05, Math.min(props.minSize, props.maxSize)),
    maxSize: Math.max(0.05, Math.max(props.minSize, props.maxSize)),
    gravity: props.gravity,
    friction: clamp(props.friction, 0.5, 1),
    wallBounce: clamp(props.wallBounce, 0, 1),
    bounce: clamp(props.bounce, 0, 1),
    depth: Math.max(0, props.depth),
    drift: Math.max(0, props.drift),
    followCursor: props.followCursor,
    cursorSize: Math.max(0, props.cursorSize),
    grab: props.grab,
    clickEffect: props.clickEffect,
    lightColor: props.lightColor,
    lightIntensity:
      props.lightIntensity > 20
        ? props.lightIntensity / 200
        : Math.max(0, props.lightIntensity),
    exposure: Math.max(0, props.exposure),
    shadows: clamp(props.shadows, 0, 1),
    intro: props.intro,
    dpr: props.dpr,
    reduce: reducedMotion.value === 'reduce',
  }));

  function readSettings() {
    return settings.value;
  }

  onMounted(() => {
    rootEl.value = document.documentElement;
    if (!containerRef.value || !canvasRef.value) return;
    engine = createBallpitEngine(
      containerRef.value,
      canvasRef.value,
      readSettings,
    );
    engine?.resize();
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  useEventListener(
    'pointermove',
    (event: PointerEvent) => engine?.pointerMove(event),
    { passive: true },
  );
  useEventListener('pointerdown', (event: PointerEvent) =>
    engine?.pointerDown(event),
  );
  useEventListener(
    'pointerup',
    (event: PointerEvent) => engine?.pointerUp(event),
    { passive: true },
  );
  useEventListener('pointercancel', () => engine?.pointerCancel(), {
    passive: true,
  });
  useEventListener(rootEl, 'pointerleave', () => engine?.pointerLeave());

  watch(visibility, () => engine?.wake());
  watch(settings, () => engine?.wake());
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  >
    <canvas ref="canvasRef" class="block size-full" aria-hidden="true" />
  </div>
</template>
