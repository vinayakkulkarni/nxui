<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { DEFAULT_COLORS, resolveSettings } from './liquid-ether-config';
  import { createLiquidEtherEngine } from './liquid-ether-engine';
  import type { LiquidEtherEngine, LiquidEtherProps } from './types';

  const props = withDefaults(defineProps<LiquidEtherProps>(), {
    colors: () => [...DEFAULT_COLORS],
    intensity: 1,
    mouseForce: 20,
    cursorSize: 100,
    persistence: 0.75,
    viscosity: 0,
    resolution: 0.5,
    bounceEdges: false,
    clickBurst: true,
    autoDemo: true,
    autoSpeed: 0.5,
    autoIntensity: 2.2,
    autoResumeDelay: 1000,
    intro: true,
    lightMode: false,
    backgroundColor: 'transparent',
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const reducedMotion = usePreferredReducedMotion();
  const settings = computed(() => resolveSettings(props));
  let engine: LiquidEtherEngine | null = null;

  function start(allowIntro: boolean) {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine?.dispose();
    engine = createLiquidEtherEngine(container, canvas, {
      getSettings: () => settings.value,
      reducedMotion: reducedMotion.value === 'reduce',
      allowIntro,
      onContextRestored: onContextRestored,
    });
  }

  function onContextRestored() {
    start(false);
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

  function onLeave() {
    engine?.leave();
  }

  function onVisibilityChange() {
    engine?.pageVisibilityChanged();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(
    () => (containerRef.value ? document.documentElement : null),
    'pointerleave',
    onLeave,
  );
  useEventListener(
    () => (containerRef.value ? document : null),
    'visibilitychange',
    onVisibilityChange,
  );

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(settings, () => engine?.refresh());

  onMounted(() => start(true));

  onBeforeUnmount(() => {
    engine?.dispose();
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
