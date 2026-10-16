<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { clamp, createCubesEngine } from './cubes-gl';
  import type { CubesEngine, CubesProps, CubesSettings } from './types';

  const props = withDefaults(defineProps<CubesProps>(), {
    gridSize: 10,
    gap: 0.18,
    faceColor: '#120F17',
    edgeColor: '#ffffff',
    edgeWidth: 1,
    edgeStyle: 'solid',
    faceOpacity: 1,
    shading: 0.6,
    maxAngle: 45,
    radius: 3,
    speed: 1,
    bounce: 0.4,
    brush: 1,
    perspective: 0,
    autoAnimate: true,
    rippleOnClick: true,
    rippleColor: '#ffffff',
    rippleSpeed: 1,
    intro: true,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<CubesSettings>(() => ({
    gridSize: Math.round(clamp(props.gridSize, 1, 40)),
    gap: clamp(props.gap, 0, 0.9),
    faceColor: props.faceColor,
    edgeColor: props.edgeColor,
    edgeWidth: Math.max(0, props.edgeWidth),
    edgeStyle: props.edgeStyle,
    faceOpacity: clamp(props.faceOpacity, 0, 1),
    shading: Math.max(0, props.shading),
    maxAngle: props.maxAngle,
    radius: Math.max(0.5, props.radius),
    speed: Math.max(0.05, props.speed),
    bounce: clamp(props.bounce, 0, 1),
    brush: Math.max(0, props.brush),
    perspective: clamp(props.perspective, 0, 1),
    autoAnimate: props.autoAnimate,
    rippleOnClick: props.rippleOnClick,
    rippleColor: props.rippleColor,
    rippleSpeed: Math.max(0.05, props.rippleSpeed),
    paused: props.paused,
    dpr: props.dpr,
  }));

  let engine: CubesEngine | null = null;

  function getSettings(): CubesSettings {
    return settings.value;
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event.clientX, event.clientY);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event.clientX, event.clientY);
  }

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createCubesEngine({
      container,
      canvas,
      getSettings,
      intro: props.intro,
      reduce: reducedMotion.value === 'reduce',
    });
    useEventListener('pointermove', onPointerMove, { passive: true });
    useEventListener(document.documentElement, 'pointerleave', onPointerLeave);
    useEventListener(document, 'visibilitychange', () =>
      engine?.visibilityChanged(),
    );
  });

  useEventListener(containerRef, 'pointerdown', onPointerDown);

  useResizeObserver(containerRef, () => engine?.resize());

  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(settings, () => engine?.refresh());

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });
</script>

<template>
  <div ref="containerRef" :class="['cubes-container', props.class]">
    <canvas ref="canvasRef" class="cubes-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .cubes-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: pan-y;
  }

  .cubes-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
