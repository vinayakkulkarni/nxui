<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { resolveSettings } from './radar-config';
  import { createRadarEngine } from './radar-engine';
  import type { RadarEngine, RadarProps } from './types';

  const props = withDefaults(defineProps<RadarProps>(), {
    color: '#3ef09a',
    backgroundColor: 'transparent',
    mode: 'sweep',
    speed: 1,
    trail: 0.35,
    scale: 0.9,
    ringCount: 6,
    spokeCount: 12,
    ticks: true,
    targets: 6,
    clutter: 0.35,
    glow: 1,
    brightness: 1,
    gridOpacity: 1,
    lineWidth: 1,
    tilt: 0,
    centerX: 0.5,
    centerY: 0.5,
    mouseInteraction: true,
    intro: true,
    grain: 0.03,
    fade: 0,
    opacity: 1,
    lightMode: false,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const reducedMotion = usePreferredReducedMotion();
  const settings = computed(() => resolveSettings(props));
  let engine: RadarEngine | null = null;

  function start() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine?.dispose();
    engine = createRadarEngine(container, canvas, {
      getSettings: () => settings.value,
      reducedMotion: reducedMotion.value === 'reduce',
    });
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onLeave() {
    engine?.leave();
  }

  function onVisibilityChange() {
    engine?.pageVisibilityChanged();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
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
