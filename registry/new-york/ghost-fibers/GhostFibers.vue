<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    defaultDocument,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    createGhostFibersEngine,
    resolveGhostFibersSettings,
  } from './ghost-fibers-gl';
  import type { GhostFibersEngine, GhostFibersProps } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<GhostFibersProps>(), {
    glowColor: '#8b5cf6',
    gradient: 'depth',
    speed: 0.5,
    scale: 1,
    rotation: 18,
    rollSpeed: 0.15,
    layers: 3,
    waves: 1,
    twist: 1.2,
    threads: 72,
    volume: 0.7,
    spread: 1,
    density: 1,
    thickness: 1,
    flow: 0.4,
    fiberStyle: 'dots',
    tips: 0,
    foldGlow: 1,
    perspective: 0.65,
    depthOfField: 0.85,
    focusDepth: 0,
    particles: 0.5,
    sparkle: 0.5,
    glow: 0.8,
    brightness: 1,
    vignette: 0.3,
    grain: 0.06,
    mouseInteraction: true,
    hoverEffect: 'focus',
    mouseStrength: 1,
    pulseOnClick: true,
    intro: true,
    lightMode: false,
    paused: false,
    class: '',
  });

  const INTERACTIVE =
    'a, button, input, textarea, select, label, [role="button"]';

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const motion = usePreferredReducedMotion();
  const settings = computed(() => resolveGhostFibersSettings(props));

  let engine: GhostFibersEngine | null = null;

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createGhostFibersEngine(
      container,
      canvas,
      settings.value,
      motion.value === 'reduce',
    );
  });

  watch(settings, (next) => engine?.update(next));
  watch(motion, (next) => engine?.setReducedMotion(next === 'reduce'));

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event.clientX, event.clientY);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest(INTERACTIVE))
      return;
    engine?.pointerDown(event.clientX, event.clientY);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  function onVisibilityChange() {
    engine?.visibilityChange();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown);
  useEventListener(
    () => defaultDocument?.documentElement,
    'pointerleave',
    onPointerLeave,
  );
  useEventListener(defaultDocument, 'visibilitychange', onVisibilityChange);

  onBeforeUnmount(() => {
    engine?.destroy();
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
