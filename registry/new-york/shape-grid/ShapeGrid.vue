<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createShapeGridEngine } from './shape-grid-engine';
  import { clamp, fadeMask, resolveSettings } from './shape-grid-math';
  import type { ShapeGridEngine, ShapeGridProps } from './types';

  const props = withDefaults(defineProps<ShapeGridProps>(), {
    shape: 'square',
    cellSize: 40,
    lineWidth: 1,
    direction: 'diagonal',
    speed: 0.5,
    lineColor: '#2a2734',
    hoverColor: '#ffffff',
    hoverFillColor: undefined,
    fillOpacity: 0.15,
    rainbow: false,
    tiltX: 0,
    tiltY: 0,
    radius: 1.5,
    trail: 0.6,
    glow: 0.35,
    twinkle: 0,
    fade: 1,
    clickCascade: true,
    intro: true,
    opacity: 1,
    backgroundColor: 'transparent',
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const reducedMotion = usePreferredReducedMotion();
  const settings = computed(() => resolveSettings(props));
  let engine: ShapeGridEngine | null = null;

  const rootStyle = computed(() => {
    const mask = fadeMask(clamp(props.fade, 0, 1));
    const base = {
      opacity: clamp(props.opacity, 0, 1),
      backgroundColor: props.backgroundColor,
    };
    if (mask === 'none') return base;
    return {
      ...base,
      maskImage: mask,
      WebkitMaskImage: mask,
      maskComposite: 'intersect',
      WebkitMaskComposite: 'source-in',
    };
  });

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }

  function onLeave() {
    engine?.leave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('blur', onLeave);
  useEventListener(
    () => (containerRef.value ? document.documentElement : null),
    'pointerleave',
    onLeave,
  );

  useResizeObserver(containerRef, () => engine?.redraw());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(settings, () => engine?.redraw());

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createShapeGridEngine(container, canvas, {
      getSettings: () => settings.value,
      reducedMotion: reducedMotion.value === 'reduce',
    });
  });

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
    :style="rootStyle"
  >
    <canvas
      ref="canvasRef"
      class="absolute top-0 left-0 block origin-top-left"
      aria-hidden="true"
    />
  </div>
</template>
