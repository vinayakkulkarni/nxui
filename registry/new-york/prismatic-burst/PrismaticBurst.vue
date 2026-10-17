<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    PRISMATIC_BURST_ANIMATIONS,
    PRISMATIC_BURST_MIN_SCALE,
    PRISMATIC_BURST_QUALITY,
    clamp,
    createPrismaticBurstEngine,
    toPx,
  } from './prismatic-burst-gl';
  import type {
    PrismaticBurstEngine,
    PrismaticBurstProps,
    PrismaticBurstSettings,
  } from './types';

  const props = withDefaults(defineProps<PrismaticBurstProps>(), {
    colors: undefined,
    intensity: 2,
    speed: 0.5,
    animationType: 'rotate3d',
    distort: 0,
    rayCount: 0,
    rayWidth: 1,
    zoom: 1,
    twist: 0,
    flow: 0,
    centerFade: 1,
    grain: 0.8,
    glow: 0,
    offset: undefined,
    mouseInteraction: true,
    mouseStrength: 0.5,
    hoverDampness: 0.25,
    clickBurst: true,
    intro: true,
    fade: 0,
    quality: 'high',
    resolution: undefined,
    lightMode: false,
    mixBlendMode: undefined,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<PrismaticBurstSettings>(() => ({
    colors: Array.isArray(props.colors)
      ? props.colors.slice(0, 64).map(String)
      : [],
    intensity: Math.max(0, props.intensity),
    speed: props.speed,
    animation:
      PRISMATIC_BURST_ANIMATIONS[props.animationType] ??
      PRISMATIC_BURST_ANIMATIONS.rotate3d,
    distort: Math.max(0, props.distort),
    rayCount: Math.max(0, Math.floor(props.rayCount ?? 0)),
    rayWidth: clamp(props.rayWidth, 0.2, 2.5),
    zoom: Math.max(0.05, props.zoom),
    twist: props.twist,
    flow: props.flow,
    centerFade: clamp(props.centerFade, 0.5, 3),
    grain: clamp(props.grain, 0.3, 1),
    glow: Math.max(0, props.glow),
    offsetX: toPx(props.offset?.x),
    offsetY: toPx(props.offset?.y),
    mouseInteraction: props.mouseInteraction,
    mouseStrength: Math.max(0, props.mouseStrength),
    hoverDampness: clamp(props.hoverDampness, 0, 1),
    clickBurst: props.clickBurst,
    intro: props.intro,
    fade: clamp(props.fade, 0, 1),
    scale: clamp(
      props.resolution ??
        PRISMATIC_BURST_QUALITY[props.quality] ??
        PRISMATIC_BURST_QUALITY.high,
      PRISMATIC_BURST_MIN_SCALE,
      1,
    ),
    lightMode: props.lightMode,
    paused: props.paused,
    dpr: props.dpr,
  }));

  const canvasStyle = computed(() =>
    props.mixBlendMode && props.mixBlendMode !== 'normal'
      ? { mixBlendMode: props.mixBlendMode }
      : undefined,
  );

  let engine: PrismaticBurstEngine | null = null;

  function getSettings(): PrismaticBurstSettings {
    return settings.value;
  }

  function start() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createPrismaticBurstEngine({
      container,
      canvas,
      getSettings,
      reduce: reducedMotion.value === 'reduce',
      onRestored,
    });
  }

  // A restored WebGL context needs fresh programs, buffers and textures.
  function onRestored() {
    engine?.dispose(false);
    start();
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event.clientX, event.clientY);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event.clientX, event.clientY);
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
    useEventListener('pointerdown', onPointerDown, { passive: true });
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
  <div ref="containerRef" :class="cn('prismatic-burst-container', props.class)">
    <canvas
      ref="canvasRef"
      class="prismatic-burst-canvas"
      :style="canvasStyle"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
  .prismatic-burst-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .prismatic-burst-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
