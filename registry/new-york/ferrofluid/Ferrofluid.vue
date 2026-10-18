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
  import {
    FERROFLUID_COLORS,
    createFerrofluid,
    normalizeFerrofluid,
  } from './ferrofluid-gl';
  import type { FerrofluidEngine, FerrofluidProps } from './types';

  const props = withDefaults(defineProps<FerrofluidProps>(), {
    colors: () => [...FERROFLUID_COLORS],
    speed: 0.5,
    scale: 1.6,
    spikeHeight: 1,
    sharpness: 2.5,
    turbulence: 1,
    fluidity: 0.5,
    tilt: 48,
    magnetism: 1,
    variation: 0,
    flowDirection: 'down',
    brightness: 1,
    mouseInteraction: true,
    mouseStrength: 1,
    mouseRadius: 0.22,
    mouseDampening: 0.15,
    clickPulse: true,
    intro: true,
    lightMode: false,
    transparent: true,
    color: undefined,
    opacity: 1,
    paused: false,
    dpr: undefined,
    mixBlendMode: undefined,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: FerrofluidEngine | null = null;

  const settings = computed(() =>
    normalizeFerrofluid(props, reducedMotion.value === 'reduce'),
  );

  const blendStyle = computed(() =>
    props.mixBlendMode ? { mixBlendMode: props.mixBlendMode } : undefined,
  );

  onMounted(() => {
    rootEl.value = document.documentElement;
    if (!containerRef.value || !canvasRef.value) return;
    engine = createFerrofluid(
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

  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
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
    :style="blendStyle"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
