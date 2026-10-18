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
  import { createSideRays, normalizeSideRays } from './side-rays-gl';
  import type { SideRaysEngine, SideRaysProps } from './types';

  const props = withDefaults(defineProps<SideRaysProps>(), {
    rayColor1: '#FFC46B',
    rayColor2: '#96c8ff',
    blend: 0.6,
    origin: 'top-right',
    speed: 2.5,
    intensity: 2,
    spread: 2,
    density: 5,
    sharpness: 0.5,
    tilt: 0,
    falloff: 1.6,
    glow: 1,
    saturation: 1,
    dust: 0,
    followMouse: true,
    mouseInfluence: 0.5,
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
  let engine: SideRaysEngine | null = null;

  const settings = computed(() =>
    normalizeSideRays(props, reducedMotion.value === 'reduce'),
  );

  function start(reveal: boolean) {
    if (!containerRef.value || !canvasRef.value) return;
    engine = createSideRays(
      containerRef.value,
      canvasRef.value,
      () => settings.value,
      {
        reveal,
        seed: Math.random(),
        pageVisible: visibility.value !== 'hidden',
      },
    );
    engine?.wake();
  }

  function stop() {
    engine?.destroy();
    engine = null;
  }

  onMounted(() => {
    rootEl.value = document.documentElement;
    start(true);
  });

  onBeforeUnmount(stop);

  useResizeObserver(containerRef, () => engine?.wake());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    engine?.contextLost();
  }

  function onContextRestored() {
    stop();
    start(false);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  watch(settings, () => engine?.wake());
  watch(visibility, (state) => engine?.setPageVisible(state !== 'hidden'));
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn('pointer-events-none relative size-full overflow-hidden', props.class)
    "
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
