<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { resolveSettings } from './dither-config';
  import { createDitherEngine } from './dither-engine';
  import type { DitherEngine, DitherProps } from './types';

  const props = withDefaults(defineProps<DitherProps>(), {
    waveSpeed: 0.05,
    waveFrequency: 3,
    waveAmplitude: 0.3,
    waveColor: () => [0.5, 0.5, 0.5],
    backgroundColor: () => [0, 0, 0],
    colorNum: 4,
    pixelSize: 2,
    disableAnimation: false,
    enableMouseInteraction: true,
    mouseRadius: 1,
    ditherMode: 'bayer',
    palette: undefined,
    scale: 1,
    contrast: 1,
    brightness: 0,
    mouseEffect: 'erase',
    mouseStrength: 1,
    trail: 0.5,
    clickRipple: true,
    intro: true,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const reducedMotion = usePreferredReducedMotion();
  const settings = computed(() => resolveSettings(props));
  let engine: DitherEngine | null = null;

  function start() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine?.dispose();
    engine = createDitherEngine(container, canvas, {
      getSettings: () => settings.value,
      reducedMotion: reducedMotion.value === 'reduce',
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
    engine?.pageVisibilityChanged();
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

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(settings, () => engine?.refresh());

  onMounted(start);

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
