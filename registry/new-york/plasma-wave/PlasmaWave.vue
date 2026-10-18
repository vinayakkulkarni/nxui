<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createPlasmaWave, normalizePlasmaWave } from './plasma-wave-gl';
  import type { PlasmaWaveEngine, PlasmaWaveProps } from './types';

  const props = withDefaults(defineProps<PlasmaWaveProps>(), {
    colors: () => ['#A855F7', '#06B6D4'],
    speed: 1,
    speed1: 0.05,
    speed2: 0.05,
    dir2: 1,
    bend1: 1,
    bend2: 0.5,
    thickness: 0.3,
    focalLength: 1.25,
    rotationDeg: 0,
    xOffset: 0,
    yOffset: 0,
    brightness: 1,
    glow: 1,
    core: 0.6,
    grain: 0.03,
    quality: 1,
    mouseInteraction: true,
    intro: true,
    fade: 0,
    opacity: 1,
    lightMode: false,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: PlasmaWaveEngine | null = null;

  const settings = computed(() =>
    normalizePlasmaWave(props, reducedMotion.value === 'reduce'),
  );

  onMounted(() => {
    rootEl.value = document.documentElement;
    if (!containerRef.value || !canvasRef.value) return;
    engine = createPlasmaWave(
      containerRef.value,
      canvasRef.value,
      () => settings.value,
    );
    engine?.resize();
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);

  watch(settings, () => engine?.wake());
  watch(visibility, () => engine?.visibilityChange());
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
