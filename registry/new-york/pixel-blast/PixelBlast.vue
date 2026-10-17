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
  import { createPixelBlast, normalizePixelBlast } from './pixel-blast-gl';
  import type { PixelBlastEngine, PixelBlastProps } from './types';

  const props = withDefaults(defineProps<PixelBlastProps>(), {
    variant: 'square',
    pixelSize: 3,
    color: '#B497CF',
    accentColor: undefined,
    patternScale: 2,
    patternDensity: 1,
    pixelSizeJitter: 0,
    enableRipples: true,
    rippleIntensityScale: 1,
    rippleThickness: 0.1,
    rippleSpeed: 0.3,
    autoPauseOffscreen: true,
    speed: 0.5,
    transparent: true,
    edgeFade: 0.5,
    noiseAmount: 0,
    softness: 0.6,
    smoothing: 1,
    glow: 0.4,
    twinkle: 0.25,
    drift: 0.2,
    driftAngle: 30,
    hoverEffect: 'reveal',
    hoverRadius: 140,
    autoRipple: 0,
    tiltX: 0,
    tiltY: 0,
    intro: true,
    variation: undefined,
    lightMode: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: PixelBlastEngine | null = null;

  const settings = computed(() =>
    normalizePixelBlast(props, reducedMotion.value === 'reduce'),
  );

  onMounted(() => {
    rootEl.value = document.documentElement;
    if (!containerRef.value || !canvasRef.value) return;
    engine = createPixelBlast(
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

  watch([settings, visibility], () => engine?.wake());
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
    aria-label="PixelBlast interactive background"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
