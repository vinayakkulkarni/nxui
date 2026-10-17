<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    defaultDocument,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import type {
    SlicedWavesProps,
    SlicedWavesRenderer,
    SlicedWavesSettings,
  } from './types';
  import { MAX_RIBBONS, clamp } from './sliced-waves-gl';
  import { createSlicedWavesRenderer } from './sliced-waves-renderer';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<SlicedWavesProps>(), {
    color1: '#ffd9a8',
    color2: '#ff5fa2',
    color3: '#5b8cff',
    ribbons: 3,
    spacing: 28,
    barWidth: 0.5,
    ribbonHeight: 0.26,
    spread: 0.1,
    amplitude: 0.1,
    frequency: 1,
    speed: 1,
    perspective: 0.45,
    curve: 0.5,
    blur: 0.6,
    glow: 1,
    brightness: 1.25,
    position: 0.78,
    rotation: 0,
    slices: 0,
    grain: 0.08,
    mouseInteraction: true,
    intro: true,
    fade: 0,
    opacity: 1,
    lightMode: false,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<SlicedWavesSettings>(() => ({
    color1: String(props.color1),
    color2: String(props.color2),
    color3: String(props.color3),
    ribbons: Math.round(clamp(props.ribbons, 1, MAX_RIBBONS)),
    spacing: clamp(props.spacing, 4, 200),
    barWidth: clamp(props.barWidth, 0.05, 1),
    ribbonHeight: Math.max(0, props.ribbonHeight),
    spread: Math.max(0, props.spread),
    amplitude: Math.max(0, props.amplitude),
    frequency: Math.max(0, props.frequency),
    speed: props.speed,
    perspective: clamp(props.perspective, 0, 1),
    curve: clamp(props.curve, 0, 1),
    blur: clamp(props.blur, 0, 2),
    glow: Math.max(0, props.glow),
    brightness: Math.max(0, props.brightness),
    position: clamp(props.position, 0, 1),
    rotation: props.rotation,
    slices: Math.max(0, Math.round(props.slices)),
    grain: Math.max(0, props.grain),
    mouseInteraction: props.mouseInteraction,
    intro: props.intro,
    fade: clamp(props.fade, 0, 1),
    opacity: clamp(props.opacity, 0, 1),
    lightMode: props.lightMode,
    paused: props.paused,
    dpr: props.dpr,
  }));

  let renderer: SlicedWavesRenderer | null = null;

  const getSettings = () => settings.value;
  const isReduced = () => reducedMotion.value === 'reduce';

  function onPointerMove(event: PointerEvent) {
    renderer?.pointerMove(event);
  }

  function onPointerLeave() {
    renderer?.pointerLeave();
  }

  function onVisibilityChange() {
    renderer?.visibilityChange();
  }

  useResizeObserver(containerRef, () => renderer?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    renderer?.setVisible(entries.some((entry) => entry.isIntersecting));
  });
  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener(
    () => defaultDocument?.documentElement,
    'pointerleave',
    onPointerLeave,
  );
  useEventListener(defaultDocument, 'visibilitychange', onVisibilityChange);

  watch([settings, reducedMotion], () => renderer?.refresh());

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    renderer = createSlicedWavesRenderer(
      container,
      canvas,
      getSettings,
      isReduced,
    );
  });

  onBeforeUnmount(() => {
    renderer?.dispose();
    renderer = null;
  });
</script>

<template>
  <div ref="containerRef" :class="cn('sliced-waves-container', props.class)">
    <canvas ref="canvasRef" class="sliced-waves-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .sliced-waves-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .sliced-waves-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
