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
  import { createBeams, normalizeBeams } from './beams-gl';
  import type { BeamsEngine, BeamsProps } from './types';

  const props = withDefaults(defineProps<BeamsProps>(), {
    color: '#ffffff',
    beamWidth: 140,
    rotation: 30,
    speed: 1,
    waveLength: 233,
    depth: 1,
    sharpness: 0.6,
    twist: 0,
    fillLight: 0.3,
    glow: 0.6,
    brightness: 1.6,
    variation: 0,
    grain: 0.35,
    quality: 0.75,
    mouseInteraction: true,
    mouseStrength: 1,
    intro: true,
    fade: 0,
    opacity: 1,
    lightMode: false,
    backgroundColor: undefined,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: BeamsEngine | null = null;

  const settings = computed(() =>
    normalizeBeams(props, reducedMotion.value === 'reduce'),
  );

  const rootStyle = computed(() =>
    props.backgroundColor ? { background: props.backgroundColor } : undefined,
  );

  onMounted(() => {
    if (!containerRef.value || !canvasRef.value) return;
    engine = createBeams(
      containerRef.value,
      canvasRef.value,
      () => settings.value,
    );
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

  function onPointerOut(event: PointerEvent) {
    engine?.pointerOut(event);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerout', onPointerOut);

  watch(settings, () => engine?.refresh());
  watch(visibility, () => engine?.visibilityChange());
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
    :style="rootStyle"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
