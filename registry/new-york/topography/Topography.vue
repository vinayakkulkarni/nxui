<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    defaultDocument,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    DIRECTIONS,
    HOVER_EFFECTS,
    MARKER_STYLES,
  } from './topography-constants';
  import { clamp } from './topography-math';
  import { createTopography } from './topography-engine';
  import type {
    TopographyEngine,
    TopographyProps,
    TopographySettings,
  } from './types';

  const props = withDefaults(defineProps<TopographyProps>(), {
    color: '#4f7cff',
    lineCount: 22,
    lineWidth: 1.2,
    majorLines: true,
    elevation: 1,
    foreground: 0.2,
    scale: 1,
    detail: 0.35,
    tilt: 32,
    speed: 0.25,
    direction: 'forward',
    morph: 0.2,
    glow: 0.6,
    depthOfField: 0.4,
    fog: 0.35,
    brightness: 1,
    opacity: 1,
    mouseInteraction: true,
    hoverEffect: 'lift',
    mouseRadius: 1,
    mouseStrength: 0.6,
    trail: 0.3,
    parallax: 0.5,
    clickEffect: 'pulse',
    markers: 'none',
    glitch: 0,
    intro: true,
    lightMode: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const motion = usePreferredReducedMotion();

  const settings = computed<TopographySettings>(() => ({
    color: props.color,
    lineCount: clamp(props.lineCount, 2, 80),
    lineWidth: Math.max(0.2, props.lineWidth),
    majorLines: props.majorLines,
    elevation: clamp(props.elevation, 0, 3),
    foreground: clamp(props.foreground, 0, 1),
    scale: clamp(props.scale, 0.2, 5),
    detail: clamp(props.detail, 0, 1),
    tilt: clamp(props.tilt, 12, 90),
    speed: props.speed,
    direction: DIRECTIONS[props.direction] ?? DIRECTIONS.forward,
    morph: Math.max(0, props.morph),
    glow: Math.max(0, props.glow),
    depthOfField: clamp(props.depthOfField, 0, 1),
    fog: clamp(props.fog, 0, 1),
    brightness: Math.max(0, props.brightness),
    opacity: clamp(props.opacity, 0, 1),
    mouseInteraction: props.mouseInteraction,
    hoverEffect: HOVER_EFFECTS.includes(props.hoverEffect)
      ? props.hoverEffect
      : 'lift',
    mouseRadius: Math.max(0.1, props.mouseRadius),
    mouseStrength: Math.max(0, props.mouseStrength),
    trail: clamp(props.trail, 0, 1),
    parallax: clamp(props.parallax, 0, 1),
    clickEffect: props.clickEffect,
    markers: MARKER_STYLES[props.markers] ?? -1,
    glitch: clamp(props.glitch, 0, 1),
    intro: props.intro,
    lightMode: props.lightMode,
    dpr: props.dpr,
    reduce: motion.value === 'reduce',
  }));

  let engine: TopographyEngine | null = null;

  function getSettings() {
    return settings.value;
  }

  function start() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createTopography(container, canvas, getSettings);
  }

  function onContextLost(event: Event) {
    event.preventDefault();
  }

  function onContextRestored() {
    engine?.destroy(false);
    engine = null;
    start();
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

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  function onVisibility() {
    engine?.wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(
    defaultDocument?.documentElement,
    'pointerleave',
    onPointerLeave,
  );
  useEventListener(defaultDocument, 'visibilitychange', onVisibility);
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(settings, () => engine?.wake());

  onMounted(start);

  onBeforeUnmount(() => {
    engine?.destroy(true);
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  >
    <canvas ref="canvasRef" class="block size-full" aria-hidden="true" />
  </div>
</template>
