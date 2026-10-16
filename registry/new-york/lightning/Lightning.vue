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
  import { createLightning, normalizeLightning } from './lightning-gl';
  import type { LightningEngine, LightningProps } from './types';

  const props = withDefaults(defineProps<LightningProps>(), {
    color: '#4d6bff',
    bolts: 1,
    spread: 0.6,
    branches: 0.5,
    xOffset: 0,
    angle: 0,
    size: 1,
    thickness: 1,
    glow: 1,
    intensity: 1,
    speed: 1,
    flicker: 0.6,
    mouseInteraction: true,
    mouseStrength: 1,
    clickStrike: true,
    intro: true,
    fade: 0,
    opacity: 1,
    lightMode: false,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: LightningEngine | null = null;

  const settings = computed(() =>
    normalizeLightning(props, reducedMotion.value === 'reduce'),
  );

  onMounted(() => {
    if (!canvasRef.value) return;
    engine = createLightning(canvasRef.value, () => settings.value);
    engine?.refresh();
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  useResizeObserver(canvasRef, () => engine?.refresh());
  useIntersectionObserver(canvasRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }

  function onPointerOut(event: PointerEvent) {
    engine?.pointerOut(event);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerout', onPointerOut);

  watch(settings, () => engine?.refresh());
  watch(visibility, () => engine?.visibilityChange());
</script>

<template>
  <canvas
    ref="canvasRef"
    :class="cn('relative block size-full', props.class)"
    aria-hidden="true"
  />
</template>
