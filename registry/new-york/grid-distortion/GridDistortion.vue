<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    createGridDistortion,
    normalizeGridDistortion,
  } from './grid-distortion-gl';
  import type { GridDistortionEngine, GridDistortionProps } from './types';

  const props = withDefaults(defineProps<GridDistortionProps>(), {
    imageSrc: undefined,
    grid: 15,
    radius: 0.18,
    strength: 0.15,
    relaxation: 0.96,
    mode: 'drag',
    softness: 0,
    chroma: 0,
    idle: 0.3,
    clickRipple: true,
    intro: true,
    class: '',
  });

  const rootRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  let engine: GridDistortionEngine | null = null;

  const settings = computed(() =>
    normalizeGridDistortion(props, reducedMotion.value === 'reduce'),
  );

  onMounted(() => {
    if (!rootRef.value || !canvasRef.value) return;
    engine = createGridDistortion(
      rootRef.value,
      canvasRef.value,
      () => settings.value,
    );
    engine?.resize();
    engine?.load(props.imageSrc);
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  useResizeObserver(rootRef, () => engine?.resize());
  useIntersectionObserver(rootRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });

  watch(
    () => props.imageSrc,
    (src) => engine?.load(src),
  );
  watch(settings, () => engine?.wake());
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn('relative size-full min-h-0 min-w-0 overflow-hidden', props.class)
    "
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
