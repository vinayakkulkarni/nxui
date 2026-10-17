<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createDotGridEngine } from './dot-grid-gl';
  import type { DotGridEngine, DotGridProps, DotGridSettings } from './types';

  const props = withDefaults(defineProps<DotGridProps>(), {
    dotSize: 5,
    gap: 18,
    baseColor: '#3a3446',
    activeColor: '#ffffff',
    proximity: 140,
    strength: 1,
    bounce: 0.6,
    tension: 0.4,
    returnDuration: 0.8,
    shockRadius: 320,
    shockStrength: 5,
    swell: 0.8,
    stretch: 0.5,
    glow: 0.5,
    shape: 'circle',
    fade: 0,
    opacity: 1,
    intro: true,
    mouseInteraction: true,
    clickShock: true,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<DotGridSettings>(() => ({
    dotSize: props.dotSize,
    gap: props.gap,
    baseColor: props.baseColor,
    activeColor: props.activeColor,
    proximity: props.proximity,
    strength: props.strength,
    bounce: props.bounce,
    tension: props.tension,
    returnDuration: props.returnDuration,
    shockRadius: props.shockRadius,
    shockStrength: props.shockStrength,
    swell: props.swell,
    stretch: props.stretch,
    glow: props.glow,
    shape: props.shape,
    fade: props.fade,
    opacity: props.opacity,
    intro: props.intro,
    mouseInteraction: props.mouseInteraction,
    clickShock: props.clickShock,
    paused: props.paused,
    dpr: props.dpr,
  }));

  let engine: DotGridEngine | null = null;

  function getSettings(): DotGridSettings {
    return settings.value;
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }

  function onPointerOut(event: PointerEvent) {
    engine?.pointerOut(event);
  }

  function onBlur() {
    engine?.pointerLeave();
  }

  function onVisibility() {
    engine?.visibilityChanged();
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createDotGridEngine({
      canvas,
      getSettings,
      reduce: reducedMotion.value === 'reduce',
    });
    useEventListener('pointermove', onPointerMove, { passive: true });
    useEventListener('pointerdown', onPointerDown, { passive: true });
    useEventListener('pointerout', onPointerOut);
    useEventListener('blur', onBlur);
    useEventListener(document, 'visibilitychange', onVisibility);
  });

  useResizeObserver(canvasRef, () => engine?.resize());

  useIntersectionObserver(canvasRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch([() => props.dotSize, () => props.gap], () => engine?.rebuild());

  watch(
    [
      () => props.baseColor,
      () => props.activeColor,
      () => props.swell,
      () => props.stretch,
      () => props.glow,
      () => props.shape,
      () => props.fade,
      () => props.opacity,
      () => props.paused,
      () => props.proximity,
      () => props.mouseInteraction,
    ],
    () => engine?.refresh(),
  );

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });
</script>

<template>
  <div :class="cn('dot-grid', props.class)">
    <canvas ref="canvasRef" class="dot-grid__canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .dot-grid {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .dot-grid__canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
