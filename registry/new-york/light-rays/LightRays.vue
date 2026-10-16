<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { resolveSettings } from './light-rays-config';
  import { createLightRaysEngine } from './light-rays-engine';
  import type { LightRaysEngine, LightRaysProps } from './types';

  const props = withDefaults(defineProps<LightRaysProps>(), {
    raysOrigin: 'top-center',
    raysColor: '#ffffff',
    raysSpeed: 1,
    lightSpread: 0.5,
    rayLength: 3,
    rayDensity: 1,
    tilt: 0,
    raySharpness: 0.35,
    glow: 0.6,
    haze: 0.25,
    atmosphere: 1,
    intensity: 1,
    pulsating: false,
    fadeDistance: 1,
    saturation: 1,
    followMouse: true,
    mouseInfluence: 0.1,
    cursorShadow: true,
    clickPulse: true,
    noiseAmount: 0,
    distortion: 0,
    intro: true,
    lightMode: false,
    opacity: 1,
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const reducedMotion = usePreferredReducedMotion();
  const settings = computed(() => resolveSettings(props));
  let engine: LightRaysEngine | null = null;

  function start(playIntro: boolean) {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine?.dispose();
    engine = createLightRaysEngine(container, canvas, {
      getSettings: () => settings.value,
      reducedMotion: reducedMotion.value === 'reduce',
      playIntro,
    });
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }

  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event);
  }

  function onLeave() {
    engine?.leave();
  }

  function onVisibilityChange() {
    engine?.setPageVisible(document.visibilityState !== 'hidden');
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    engine?.dispose();
    engine = null;
  }

  function onContextRestored() {
    start(false);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(
    () => (containerRef.value ? document.documentElement : null),
    'pointerleave',
    onLeave,
  );
  useEventListener(
    () => (containerRef.value ? document : null),
    'visibilitychange',
    onVisibilityChange,
  );
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  useResizeObserver(containerRef, () => engine?.refresh());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(settings, () => engine?.refresh());

  onMounted(() => start(true));

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn('pointer-events-none relative size-full overflow-hidden', props.class)
    "
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
