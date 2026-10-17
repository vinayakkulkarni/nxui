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
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createPixelTrailEngine, parseColor } from './pixel-trail-engine';
  import { DECAYS, SHAPES, identityEase } from './pixel-trail-shaders';
  import type {
    PixelTrailEngine,
    PixelTrailProps,
    PixelTrailSettings,
  } from './types';

  const props = withDefaults(defineProps<PixelTrailProps>(), {
    gridSize: 40,
    trailSize: 0.1,
    maxAge: 250,
    interpolate: 5,
    easingFunction: (x: number) => x,
    gooeyFilter: () => ({ strength: 2 }),
    color: '#ffffff',
    trailColor: undefined,
    shape: 'square',
    gap: 0.08,
    decay: 'fade',
    flow: 0,
    gravity: 0,
    sparkle: 0,
    clickBurst: false,
    shine: 0.6,
    glow: 0.4,
    imageSrc: undefined,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const docElRef = shallowRef<HTMLElement | null>(null);
  const engine = shallowRef<PixelTrailEngine | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<PixelTrailSettings>(() => {
    const still = reducedMotion.value === 'reduce';
    return {
      gridSize: Math.max(1, props.gridSize),
      trailSize: Math.max(0, props.trailSize),
      maxAge: Math.max(1, props.maxAge),
      interpolate: props.interpolate,
      ease: props.easingFunction ?? identityEase,
      goo: props.gooeyFilter ? Math.max(0, props.gooeyFilter.strength ?? 2) : 0,
      color: parseColor(props.color, [1, 1, 1]),
      trailColor: props.trailColor
        ? parseColor(props.trailColor, [1, 1, 1])
        : null,
      shape: SHAPES[props.shape] ?? 0,
      gap: Math.min(Math.max(props.gap, 0), 0.9),
      decay: DECAYS[props.decay] ?? 0,
      flow: still ? 0 : Math.min(Math.max(props.flow, 0), 1),
      gravity: still ? 0 : Math.min(Math.max(props.gravity, -1), 1),
      sparkle: still ? 0 : Math.min(Math.max(props.sparkle, 0), 1),
      clickBurst: props.clickBurst,
      shine: Math.min(Math.max(props.shine, 0), 1),
      glow: Math.min(Math.max(props.glow, 0), 1),
      dpr: props.dpr,
    };
  });

  function getSettings() {
    return settings.value;
  }

  let imageToken = 0;

  function loadImage(src: string | undefined) {
    const token = ++imageToken;
    if (!src) {
      engine.value?.setImage(null);
      return;
    }
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (token === imageToken) engine.value?.setImage(image);
    };
    image.onerror = () => {
      if (token === imageToken) engine.value?.setImage(null);
    };
    image.src = src;
  }

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    docElRef.value = document.documentElement;
    engine.value = createPixelTrailEngine({ container, canvas, getSettings });
    loadImage(props.imageSrc);
  });

  watch(settings, () => engine.value?.redraw());
  watch(
    () => props.imageSrc,
    (src) => loadImage(src),
  );

  useResizeObserver(containerRef, () => engine.value?.redraw());

  useIntersectionObserver(containerRef, (entries) => {
    engine.value?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  useEventListener(
    'pointermove',
    (event: PointerEvent) => engine.value?.onMove(event),
    {
      passive: true,
    },
  );
  useEventListener(
    'pointerdown',
    (event: PointerEvent) => engine.value?.onDown(event),
    {
      passive: true,
    },
  );
  useEventListener(docElRef, 'pointerleave', () => engine.value?.onLeave());
  useEventListener('blur', () => engine.value?.onLeave());

  onBeforeUnmount(() => {
    imageToken++;
    engine.value?.dispose();
    engine.value = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'pointer-events-none relative z-1 size-full overflow-hidden',
        props.class,
      )
    "
  >
    <canvas ref="canvasRef" class="block size-full" aria-hidden="true" />
  </div>
</template>
