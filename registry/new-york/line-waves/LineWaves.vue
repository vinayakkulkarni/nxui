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
    createLineWavesEngine,
    toLineWavesSettings,
  } from './line-waves-engine';
  import type { LineWavesEngine, LineWavesProps } from './types';

  const props = withDefaults(defineProps<LineWavesProps>(), {
    color1: '#ffffff',
    color2: '#ffffff',
    color3: '#ffffff',
    colorCycleSpeed: 1,
    speed: 0.3,
    lineCount: 72,
    lineWidth: 1.3,
    glow: 0.6,
    brightness: 1,
    highlight: 1,
    highlightWidth: 1,
    warpIntensity: 1,
    warpScale: 1,
    rotation: -33,
    edgeFade: 0,
    enableMouseInteraction: true,
    mouseInfluence: 2,
    clickRipple: true,
    intro: true,
    lightMode: false,
    opacity: 1,
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  let engine: LineWavesEngine | null = null;
  let inView = true;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';
  const settings = computed(() => toLineWavesSettings(props));

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!engine || !engine.frame(timestamp)) pause();
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
    engine.resize(el.clientWidth, el.clientHeight);
    wake();
  }

  function start(playIntro: boolean) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createLineWavesEngine(
      canvas,
      () => settings.value,
      isReduced,
      playIntro,
    );
    if (!engine) {
      failed.value = true;
      return;
    }
    measure();
  }

  useResizeObserver(containerRef, measure);

  useIntersectionObserver(containerRef, (entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    if (inView) wake();
    else pause();
  });

  watch(visibility, (state) => {
    if (state === 'hidden') pause();
    else wake();
  });

  watch(
    () => props.maxDevicePixelRatio,
    () => measure(),
  );
  watch([settings, reducedMotion], wake);

  function locate(event: PointerEvent) {
    const el = containerRef.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return {
      x,
      y,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  }

  function onPointerMove(event: PointerEvent) {
    const at = locate(event);
    if (!at || !engine) return;
    engine.pointerMove(at.x, at.y, at.inside);
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    const at = locate(event);
    if (!at || !engine) return;
    engine.pointerDown(at.x, at.y, at.inside);
    wake();
  }

  function onPointerLeave() {
    engine?.pointerLeave();
    wake();
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') onPointerLeave();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    pause();
  }

  function onContextRestored() {
    engine?.dispose();
    engine = null;
    start(false);
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
    start(true);
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
