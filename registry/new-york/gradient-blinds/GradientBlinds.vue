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
    GRADIENT_BLINDS_DEFAULT_COLORS,
    clamp,
    createGradientBlindsEngine,
  } from './gradient-blinds-gl';
  import type {
    GradientBlindsEngine,
    GradientBlindsProps,
    GradientBlindsSettings,
  } from './types';

  const props = withDefaults(defineProps<GradientBlindsProps>(), {
    gradientColors: undefined,
    angle: 0,
    noise: 0.3,
    blindCount: 16,
    blindMinWidth: 60,
    mouseDampening: 0.15,
    mirrorGradient: false,
    spotlightRadius: 0.5,
    spotlightSoftness: 1,
    spotlightOpacity: 1,
    distortAmount: 0,
    shineDirection: 'left',
    lightColor: '#ffffff',
    perspective: 0,
    gradientSpeed: 0,
    shine: 0.4,
    relief: 0.5,
    glow: 0.4,
    sway: 0.35,
    speed: 1,
    hoverTilt: 0.6,
    clickEffect: 'ripple',
    idle: 'drift',
    intro: true,
    mixBlendMode: 'lighten',
    lightMode: false,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const colors = computed(() =>
    props.gradientColors?.length
      ? props.gradientColors
      : GRADIENT_BLINDS_DEFAULT_COLORS,
  );

  const settings = computed<GradientBlindsSettings>(() => ({
    paused: props.paused,
    colorKey: colors.value.join(','),
    gradientColors: colors.value,
    angle: props.angle,
    noise: clamp(props.noise, 0, 2),
    blindCount: Math.max(1, props.blindCount || 1),
    blindMinWidth: props.blindMinWidth,
    mouseDampening: Math.max(0, props.mouseDampening),
    mirrorGradient: props.mirrorGradient,
    spotlightRadius: props.spotlightRadius,
    spotlightSoftness: props.spotlightSoftness,
    spotlightOpacity: props.spotlightOpacity,
    distortAmount: props.distortAmount,
    shineDirection: props.shineDirection,
    lightColor: props.lightColor,
    perspective: clamp(props.perspective, -1, 1),
    gradientSpeed: props.gradientSpeed,
    shine: clamp(props.shine, 0, 2),
    relief: clamp(props.relief, 0, 1),
    glow: clamp(props.glow, 0, 2),
    sway: clamp(props.sway, 0, 1),
    speed: clamp(props.speed, 0, 4),
    hoverTilt: clamp(props.hoverTilt, 0, 1.5),
    clickEffect: props.clickEffect,
    idle: props.idle,
    intro: props.intro,
    lightMode: props.lightMode,
    dpr: props.dpr,
  }));

  // Dark areas blend away so the page shows through; light mode paints on
  // white, so blending would wash it out.
  const containerStyle = computed(() =>
    !props.lightMode && props.mixBlendMode
      ? { mixBlendMode: props.mixBlendMode }
      : undefined,
  );

  let engine: GradientBlindsEngine | null = null;

  function getSettings(): GradientBlindsSettings {
    return settings.value;
  }

  function start() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createGradientBlindsEngine({
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

  watch(
    () => props.dpr,
    () => engine?.resize(),
  );

  onBeforeUnmount(() => {
    engine?.dispose(true);
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('gradient-blinds-container', props.class)"
    :style="containerStyle"
  >
    <canvas ref="canvasRef" class="gradient-blinds-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .gradient-blinds-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .gradient-blinds-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
