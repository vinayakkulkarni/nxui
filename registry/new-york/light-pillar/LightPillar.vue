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
    LIGHT_PILLAR_MIN_SCALE,
    LIGHT_PILLAR_QUALITY,
    clamp,
    createLightPillarEngine,
  } from './light-pillar-gl';
  import type {
    LightPillarEngine,
    LightPillarProps,
    LightPillarSettings,
  } from './types';

  const props = withDefaults(defineProps<LightPillarProps>(), {
    topColor: '#5227FF',
    bottomColor: '#FF9FFC',
    intensity: 1,
    rotationSpeed: 0.3,
    flow: 1,
    interactive: true,
    clickPulse: true,
    glowAmount: 0.002,
    bloom: 0.5,
    pillarWidth: 3,
    pillarHeight: 0.4,
    pillarRotation: 25,
    twist: 0.4,
    detail: 4,
    noiseIntensity: 0.5,
    fade: 0,
    intro: true,
    mixBlendMode: 'screen',
    quality: 'high',
    resolution: undefined,
    lightMode: false,
    paused: false,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<LightPillarSettings>(() => ({
    topColor: String(props.topColor),
    bottomColor: String(props.bottomColor),
    intensity: Math.max(0, props.intensity),
    rotationSpeed: props.rotationSpeed,
    flow: props.flow,
    interactive: props.interactive,
    clickPulse: props.clickPulse,
    glowAmount: Math.max(0, props.glowAmount),
    bloom: Math.max(0, props.bloom),
    pillarWidth: Math.max(0.05, props.pillarWidth),
    pillarHeight: props.pillarHeight,
    pillarRotation: props.pillarRotation,
    twist: props.twist,
    detail: Math.round(clamp(props.detail, 1, 6)),
    noiseIntensity: Math.max(0, props.noiseIntensity),
    fade: clamp(props.fade, 0, 1),
    intro: props.intro,
    scale: clamp(
      props.resolution ??
        LIGHT_PILLAR_QUALITY[props.quality] ??
        LIGHT_PILLAR_QUALITY.high,
      LIGHT_PILLAR_MIN_SCALE,
      2,
    ),
    lightMode: props.lightMode,
    paused: props.paused,
  }));

  const rootStyle = computed(() => ({ mixBlendMode: props.mixBlendMode }));

  let engine: LightPillarEngine | null = null;

  function getSettings(): LightPillarSettings {
    return settings.value;
  }

  function start() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createLightPillarEngine({
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
  <div
    ref="containerRef"
    :class="cn('light-pillar-container', props.class)"
    :style="rootStyle"
  >
    <canvas ref="canvasRef" class="light-pillar-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .light-pillar-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .light-pillar-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
