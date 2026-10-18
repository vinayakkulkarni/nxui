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
  import { createPixelSnow, normalizePixelSnow } from './pixel-snow-gl';
  import type { PixelSnowEngine, PixelSnowProps } from './types';

  const props = withDefaults(defineProps<PixelSnowProps>(), {
    color: '#ffffff',
    variant: 'snowflake',
    density: 0.5,
    speed: 1,
    wind: 0.25,
    sway: 0.5,
    flakeSize: 1,
    pixelSize: 3,
    depth: 0.6,
    brightness: 1,
    glow: 0.8,
    twinkle: 0.35,
    accumulate: false,
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
  let engine: PixelSnowEngine | null = null;

  const settings = computed(() =>
    normalizePixelSnow(props, reducedMotion.value === 'reduce'),
  );

  onMounted(() => {
    rootEl.value = document.documentElement;
    if (!containerRef.value || !canvasRef.value) return;
    engine = createPixelSnow(
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
