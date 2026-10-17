<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    createSoftAuroraEngine,
    toSoftAuroraSettings,
  } from './soft-aurora-engine';
  import type { SoftAuroraEngine, SoftAuroraProps } from './types';

  const props = withDefaults(defineProps<SoftAuroraProps>(), {
    speed: 0.6,
    scale: 1.5,
    brightness: 1,
    color1: '#f7f7f7',
    color2: '#e100ff',
    noiseFrequency: 2.5,
    noiseAmplitude: 1,
    bandHeight: 0.5,
    bandSpread: 1,
    octaveDecay: 0.1,
    layerOffset: 0,
    colorSpeed: 1,
    spectrum: 1,
    tilt: 0,
    enableMouseInteraction: true,
    mouseInfluence: 0.25,
    clickPulse: true,
    intro: true,
    lightMode: false,
    opacity: 1,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  let engine: SoftAuroraEngine | null = null;
  let inView = true;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';

  const settings = computed(() => toSoftAuroraSettings(props));

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!engine || !inView || visibility.value === 'hidden') {
        pause();
        return;
      }
      if (!engine.frame(timestamp)) pause();
    },
    { immediate: false },
  );

  function wake() {
    if (!engine || isActive.value || !inView) return;
    if (visibility.value === 'hidden') return;
    engine.resetClock();
    resume();
  }

  function measure() {
    const el = containerRef.value;
    if (!el || !engine) return;
    const rect = el.getBoundingClientRect();
    engine.resize(rect.width, rect.height);
  }

  useResizeObserver(containerRef, () => {
    measure();
    wake();
  });

  useIntersectionObserver(containerRef, (entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    wake();
  });

  watch(visibility, wake);

  watch([settings, reducedMotion], () => {
    measure();
    wake();
  });

  function locate(event: PointerEvent) {
    const el = containerRef.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      inside:
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom,
    };
  }

  function onPointerMove(event: PointerEvent) {
    const spot = locate(event);
    if (!spot || !engine) return;
    engine.pointerMove(spot.x, spot.y, spot.inside);
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    const spot = locate(event);
    if (!spot?.inside || !engine) return;
    if (engine.pulse(spot.x, spot.y)) wake();
  }

  function onPointerLeave() {
    engine?.pointerLeave();
    wake();
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') onPointerLeave();
  }

  function start(skipIntro: boolean) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createSoftAuroraEngine(
      canvas,
      () => settings.value,
      isReduced,
      skipIntro,
    );
    if (!engine) {
      failed.value = true;
      return;
    }
    measure();
    wake();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    pause();
  }

  function onContextRestored() {
    pause();
    engine = null;
    start(true);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  onMounted(() => {
    rootEl.value = document.documentElement;
    start(false);
  });

  onBeforeUnmount(() => {
    pause();
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
      v-if="!failed"
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
