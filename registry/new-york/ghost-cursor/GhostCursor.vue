<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    clamp,
    createGhostCursorEngine,
    parseGhostColor,
  } from './ghost-cursor-gl';
  import type {
    GhostCursorEngine,
    GhostCursorProps,
    GhostCursorSettings,
  } from './types';

  const props = withDefaults(defineProps<GhostCursorProps>(), {
    color: '#B497CF',
    brightness: 1,
    size: 80,
    trailLength: 50,
    inertia: 0.5,
    turbulence: 0.5,
    drift: 0.3,
    detail: 1,
    grainIntensity: 0.05,
    bloomStrength: 0.6,
    bloomRadius: 1,
    bloomThreshold: 0.025,
    edgeIntensity: 0,
    clickPuff: true,
    intro: true,
    theme: 'dark',
    mixBlendMode: undefined,
    fadeDelayMs: undefined,
    fadeDurationMs: undefined,
    maxDevicePixelRatio: 2,
    targetPixels: undefined,
    zIndex: 10,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const touch = ref(false);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();

  const settings = computed<GhostCursorSettings>(() => {
    const [r, g, b] = parseGhostColor(props.color);
    return {
      color: [Math.pow(r, 2.2), Math.pow(g, 2.2), Math.pow(b, 2.2)],
      brightness: Math.max(0, props.brightness),
      size: Math.max(8, props.size),
      trail: clamp(props.trailLength, 1, 200),
      inertia: clamp(props.inertia, 0, 0.99),
      turbulence: clamp(props.turbulence, 0, 2),
      drift: props.drift,
      detail: clamp(props.detail, 0, 1),
      grain: clamp(props.grainIntensity, 0, 1),
      bloom: Math.max(0, props.bloomStrength),
      bloomRadius: clamp(props.bloomRadius, 0, 3),
      threshold: Math.max(0, props.bloomThreshold),
      edge: clamp(props.edgeIntensity, 0, 1),
      clickPuff: props.clickPuff,
      theme: props.theme === 'light' ? 1 : 0,
      fadeDelay: Math.max(0, props.fadeDelayMs ?? (touch.value ? 500 : 1000)),
      fadeDuration: Math.max(
        1,
        props.fadeDurationMs ?? (touch.value ? 1000 : 1500),
      ),
      maxRatio: clamp(props.maxDevicePixelRatio, 0.25, 3),
      budget: Math.max(5e4, props.targetPixels ?? (touch.value ? 3e5 : 6e5)),
    };
  });

  const blend = computed(
    () => props.mixBlendMode ?? (props.theme === 'light' ? 'normal' : 'screen'),
  );

  let engine: GhostCursorEngine | null = null;
  let generation = 0;
  let restoreParent: (() => void) | null = null;

  function getSettings(): GhostCursorSettings {
    return settings.value;
  }

  function start() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createGhostCursorEngine({
      container,
      canvas,
      getSettings,
      intro:
        props.intro && reducedMotion.value !== 'reduce' && generation === 0,
      pageVisible: visibility.value !== 'hidden',
    });
  }

  function stop() {
    engine?.dispose();
    engine = null;
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event.clientX, event.clientY);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event.clientX, event.clientY);
  }

  function onLeave() {
    engine?.leave();
  }

  function onContextRestored() {
    stop();
    generation += 1;
    start();
  }

  onMounted(() => {
    touch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const parent = containerRef.value?.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      const previous = parent.style.position;
      parent.style.position = 'relative';
      restoreParent = () => {
        parent.style.position = previous;
      };
    }
    start();
    useEventListener('pointermove', onPointerMove, { passive: true });
    useEventListener('pointerdown', onPointerDown, { passive: true });
    useEventListener(document.documentElement, 'pointerleave', onLeave);
  });

  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  useResizeObserver(containerRef, () => engine?.markDirty());

  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(visibility, (value) => engine?.setPageVisible(value !== 'hidden'));

  watch(settings, () => engine?.wake());

  onBeforeUnmount(() => {
    stop();
    restoreParent?.();
    restoreParent = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="['ghost-cursor', props.class]"
    :style="{ zIndex: props.zIndex }"
  >
    <canvas
      ref="canvasRef"
      class="ghost-cursor__canvas"
      :style="{ mixBlendMode: blend }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
  .ghost-cursor {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .ghost-cursor__canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
