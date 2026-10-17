<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { clamp, createPrismEngine } from './prism-gl';
  import type { PrismEngine, PrismProps, PrismSettings } from './types';

  const props = withDefaults(defineProps<PrismProps>(), {
    height: 3.5,
    baseWidth: 5.5,
    animationType: 'rotate',
    glow: 1,
    offset: undefined,
    noise: 0,
    scale: 3.6,
    hueShift: 0,
    colorFrequency: 1,
    colors: undefined,
    saturation: 1.5,
    timeScale: 0.5,
    interactive: true,
    hoverStrength: 2,
    inertia: 0.05,
    intro: true,
    resolution: 0.5,
    lightMode: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<PrismSettings>(() => ({
    height: Math.max(0.1, props.height),
    baseWidth: Math.max(0.1, props.baseWidth),
    animationType:
      props.animationType === 'rotate3d' ? '3drotate' : props.animationType,
    glow: Math.max(0, props.glow),
    offsetX: props.offset?.x ?? 0,
    offsetY: props.offset?.y ?? 0,
    noise: Math.max(0, props.noise),
    scale: Math.max(0.1, props.scale),
    hueShift: ((props.hueShift || 0) * Math.PI) / 180,
    colorFrequency: Math.max(0, props.colorFrequency),
    colors: Array.isArray(props.colors)
      ? props.colors.filter(Boolean).slice(0, 8)
      : [],
    saturation: Math.max(0, props.saturation),
    timeScale: Math.max(0, props.timeScale),
    interactive: props.interactive,
    hoverStrength: Math.max(0, props.hoverStrength),
    inertia: clamp(props.inertia, 0.001, 1),
    intro: props.intro,
    resolution: clamp(props.resolution, 0.25, 1),
    lightMode: props.lightMode,
    dpr: props.dpr,
  }));

  let engine: PrismEngine | null = null;

  function getSettings(): PrismSettings {
    return settings.value;
  }

  function start() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createPrismEngine({
      container,
      canvas,
      getSettings,
      reduce: reducedMotion.value === 'reduce',
      onRestored,
    });
  }

  function onRestored() {
    engine?.dispose(false);
    start();
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event.clientX, event.clientY);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  function onVisibility() {
    engine?.visibilityChanged();
  }

  onMounted(() => {
    start();
    useEventListener('pointermove', onPointerMove, { passive: true });
    useEventListener('blur', onPointerLeave);
    useEventListener(document.documentElement, 'pointerleave', onPointerLeave);
    useEventListener(document, 'visibilitychange', onVisibility);
  });

  useResizeObserver(containerRef, () => engine?.resize());

  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(settings, () => engine?.refresh());

  onBeforeUnmount(() => {
    engine?.dispose(true);
    engine = null;
  });
</script>

<template>
  <div ref="containerRef" :class="cn('prism', props.class)">
    <canvas ref="canvasRef" class="prism-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .prism {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .prism-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
