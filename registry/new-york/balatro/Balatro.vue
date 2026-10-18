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
  import { clamp, createBalatroEngine, parseColor } from './balatro-gl';
  import type {
    BalatroEngine,
    BalatroPointer,
    BalatroProps,
    BalatroSettings,
  } from './types';

  const props = withDefaults(defineProps<BalatroProps>(), {
    color1: '#DE443B',
    color2: '#006BB4',
    color3: '#162325',
    contrast: 3.5,
    lighting: 0.4,
    swirl: 0.25,
    speed: 1,
    rotationSpeed: 0,
    scale: 1,
    detail: 5,
    offset: () => [0, 0],
    pixelSize: 1.5,
    crt: 0,
    mouseInteraction: true,
    mouseStrength: 1,
    clickSwirl: true,
    intro: true,
    lightMode: false,
    opacity: 1,
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const rootRef = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const pageVisibility = useDocumentVisibility();
  let engine: BalatroEngine | null = null;
  let disposed = false;

  const settings = computed<BalatroSettings>(() => ({
    color1: parseColor(props.color1) ?? [0.871, 0.267, 0.231],
    color2: parseColor(props.color2) ?? [0, 0.42, 0.706],
    color3: parseColor(props.color3) ?? [0.086, 0.137, 0.145],
    contrast: clamp(props.contrast, 0.5, 10),
    lighting: clamp(props.lighting, 0, 1.5),
    swirl: clamp(props.swirl, 0, 1),
    speed: Math.max(0, props.speed),
    rotation: clamp(props.rotationSpeed, -10, 10),
    scale: clamp(props.scale, 0.2, 5),
    detail: clamp(Math.round(props.detail), 1, 8),
    offset: [Number(props.offset[0]) || 0, Number(props.offset[1]) || 0],
    pixelSize: clamp(props.pixelSize, 0, 24),
    crt: clamp(props.crt, 0, 1),
    mouse: props.mouseInteraction,
    strength: clamp(props.mouseStrength, 0, 3),
    clickSwirl: props.clickSwirl,
    intro: props.intro,
    light: props.lightMode,
    opacity: clamp(props.opacity, 0, 1),
    maxRatio: clamp(props.maxDevicePixelRatio, 0.5, 3),
  }));

  function readSettings(): BalatroSettings {
    return settings.value;
  }

  function start(firstRun: boolean) {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas || disposed) return;
    engine = createBalatroEngine(
      container,
      canvas,
      readSettings,
      reducedMotion.value === 'reduce',
      firstRun,
      onContextRestored,
    );
    engine?.setPageVisible(pageVisibility.value !== 'hidden');
  }

  function onContextRestored() {
    engine?.destroy();
    engine = null;
    start(false);
  }

  function onPointerMove(event: BalatroPointer) {
    engine?.pointerMove(event);
  }

  function onPointerDown(event: BalatroPointer) {
    engine?.pointerDown(event);
  }

  function onPointerUp(event: BalatroPointer) {
    engine?.pointerUp(event);
  }

  function onLeave() {
    engine?.leave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootRef, 'pointerleave', onLeave);

  useResizeObserver(containerRef, () => {
    engine?.resize();
    engine?.wake();
  });

  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(pageVisibility, (state) => {
    engine?.setPageVisible(state !== 'hidden');
  });

  watch(settings, () => {
    engine?.resize();
    engine?.wake();
  });

  onMounted(() => {
    rootRef.value = document.documentElement;
    start(true);
  });

  onBeforeUnmount(() => {
    disposed = true;
    engine?.destroy();
    engine?.loseContext();
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
