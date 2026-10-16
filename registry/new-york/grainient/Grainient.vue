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
  import {
    GRAINIENT_COLORS,
    createGrainient,
    normalizeGrainient,
  } from './grainient-gl';
  import type { GrainientEngine, GrainientProps } from './types';

  const props = withDefaults(defineProps<GrainientProps>(), {
    colors: () => [...GRAINIENT_COLORS],
    type: 'linear',
    angle: 55,
    bands: 1,
    speed: 1,
    flow: 0.8,
    scale: 1,
    softness: 1,
    silk: 0.35,
    grainAmount: 0.08,
    grainSize: 1.2,
    grainAnimated: true,
    contrast: 1,
    saturation: 1,
    variation: 0,
    interactive: true,
    stir: 1,
    clickSwirl: true,
    intro: true,
    lightMode: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: GrainientEngine | null = null;

  const settings = computed(() =>
    normalizeGrainient(props, reducedMotion.value === 'reduce'),
  );

  onMounted(() => {
    rootEl.value = document.documentElement;
    if (!containerRef.value || !canvasRef.value) return;
    engine = createGrainient(
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

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
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
