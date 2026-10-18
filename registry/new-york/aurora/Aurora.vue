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
  import { createAurora, normalizeAurora } from './aurora-gl';
  import type { AuroraEngine, AuroraProps } from './types';

  const props = withDefaults(defineProps<AuroraProps>(), {
    colorStops: () => ['#5227FF', '#7cff67', '#5227FF'],
    amplitude: 1,
    blend: 0.5,
    speed: 1,
    time: undefined,
    height: 0.45,
    scale: 1,
    glow: 0.6,
    brightness: 1,
    layers: 1,
    direction: 'top',
    mouseInteraction: true,
    intro: true,
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
  let engine: AuroraEngine | null = null;

  const settings = computed(() =>
    normalizeAurora(props, reducedMotion.value === 'reduce'),
  );

  function start() {
    if (!containerRef.value || !canvasRef.value) return;
    engine = createAurora(
      containerRef.value,
      canvasRef.value,
      () => settings.value,
    );
    engine?.resize();
  }

  function stop() {
    engine?.destroy();
    engine = null;
  }

  onMounted(() => {
    rootEl.value = document.documentElement;
    start();
  });

  onBeforeUnmount(stop);

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerMove, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
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
