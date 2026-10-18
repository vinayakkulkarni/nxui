<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { ORB_DEFAULT_COLORS, clamp, createOrbEngine } from './orb-gl';
  import type { OrbEngine, OrbProps, OrbSettings } from './types';

  const props = withDefaults(defineProps<OrbProps>(), {
    colors: undefined,
    hue: 0,
    backgroundColor: '#000000',
    size: 1,
    glow: 1,
    bleed: 1,
    wobble: 1,
    highlight: 1,
    trail: 1,
    tiltX: 0,
    tiltY: 0,
    speed: 1,
    hoverIntensity: 1,
    rotateOnHover: true,
    forceHoverState: false,
    followCursor: true,
    clickPulse: true,
    intro: true,
    opacity: 1,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<OrbSettings>(() => {
    const palette = Array.isArray(props.colors) ? props.colors : [];
    return {
      colors: [
        String(palette[0] ?? ORB_DEFAULT_COLORS[0]),
        String(palette[1] ?? palette[0] ?? ORB_DEFAULT_COLORS[1]),
        String(palette[2] ?? ORB_DEFAULT_COLORS[2]),
      ],
      hue: props.hue,
      backgroundColor: String(props.backgroundColor),
      size: clamp(props.size, 0.1, 3),
      glow: clamp(props.glow, 0.1, 5),
      bleed: clamp(props.bleed, 0, 4),
      wobble: Math.max(0, props.wobble),
      highlight: Math.max(0, props.highlight),
      trail: Math.max(0, props.trail),
      tiltX: clamp(props.tiltX, -70, 70),
      tiltY: clamp(props.tiltY, -70, 70),
      speed: props.speed,
      hoverIntensity: Math.max(0, props.hoverIntensity),
      rotateOnHover: props.rotateOnHover,
      forceHoverState: props.forceHoverState,
      followCursor: props.followCursor,
      clickPulse: props.clickPulse,
      intro: props.intro,
      opacity: clamp(props.opacity, 0, 1),
      paused: props.paused,
      dpr: props.dpr,
    };
  });

  let engine: OrbEngine | null = null;

  function getSettings(): OrbSettings {
    return settings.value;
  }

  function start() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createOrbEngine({
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

  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event.pointerType);
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
    useEventListener('pointerup', onPointerUp, { passive: true });
    useEventListener('pointercancel', onPointerUp, { passive: true });
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
  <div ref="containerRef" :class="cn('orb-container', props.class)">
    <canvas ref="canvasRef" class="orb-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .orb-container {
    position: relative;
    z-index: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .orb-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
