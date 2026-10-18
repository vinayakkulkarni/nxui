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
  import { createLightfall, normalizeLightfall } from './lightfall-gl';
  import type { LightfallEngine, LightfallProps } from './types';

  const props = withDefaults(defineProps<LightfallProps>(), {
    colors: () => ['#ffffff'],
    backgroundColor: '#94a3b8',
    speed: 0.3,
    streakCount: 2,
    streakWidth: 0.8,
    streakLength: 1,
    glow: 1,
    density: 0.6,
    twinkle: 0.3,
    zoom: 3,
    backgroundGlow: 0.1,
    headGlow: 0.6,
    depth: 0.5,
    bloom: 0.35,
    opacity: 1,
    mouseInteraction: true,
    mouseStrength: 0.4,
    mouseRadius: 0.45,
    mouseDampening: 0.15,
    lens: 0.5,
    holdToWarp: true,
    intro: true,
    fade: 0,
    lightMode: false,
    mixBlendMode: undefined,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: LightfallEngine | null = null;

  const settings = computed(() =>
    normalizeLightfall(props, reducedMotion.value === 'reduce'),
  );

  const containerStyle = computed(() =>
    props.mixBlendMode ? { mixBlendMode: props.mixBlendMode } : undefined,
  );

  function start() {
    if (!containerRef.value || !canvasRef.value) return;
    engine = createLightfall(
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

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }

  function onPointerUp() {
    engine?.pointerUp();
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
  }

  function onContextRestored() {
    stop();
    start();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  watch(settings, () => engine?.wake());
  watch(visibility, () => engine?.visibilityChange());
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
    :style="containerStyle"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
