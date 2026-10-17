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
  import { createAntigravity, normalizeAntigravity } from './antigravity-gl';
  import type { AntigravityEngine, AntigravityProps } from './types';

  const props = withDefaults(defineProps<AntigravityProps>(), {
    count: 1500,
    magnetRadius: 9,
    ringRadius: 7,
    waveSpeed: 0.4,
    waveAmplitude: 1,
    waveCount: 3,
    particleSize: 0.9,
    lerpSpeed: 0.05,
    color: undefined,
    colors: () => ['#5227FF', '#FF9FFC', '#B497CF'],
    colorMode: 'conic',
    colorSpeed: 0.05,
    autoAnimate: true,
    particleVariance: 1,
    rotationSpeed: 0,
    depthFactor: 1,
    pulseSpeed: 3,
    particleShape: 'capsule',
    fieldStrength: 10,
    ambient: 0.25,
    interactive: true,
    clickBurst: true,
    intro: true,
    lightMode: false,
    opacity: 1,
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: AntigravityEngine | null = null;

  const settings = computed(() =>
    normalizeAntigravity(props, reducedMotion.value === 'reduce'),
  );

  function mount(allowIntro: boolean) {
    engine?.destroy();
    engine = null;
    if (!containerRef.value || !canvasRef.value) return;
    engine = createAntigravity(
      containerRef.value,
      canvasRef.value,
      () => settings.value,
      allowIntro,
    );
    engine?.setPageVisible(visibility.value !== 'hidden');
    engine?.resize();
  }

  onMounted(() => {
    rootEl.value = document.documentElement;
    mount(true);
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

  function onContextLost(event: Event) {
    engine?.contextLost(event);
  }

  function onContextRestored() {
    mount(false);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  watch(settings, () => engine?.wake());
  watch(visibility, (value) => engine?.setPageVisible(value !== 'hidden'));
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
