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
    createIridescenceEngine,
    toIridescenceSettings,
  } from './iridescence-engine';
  import type { IridescenceEngine, IridescenceProps } from './types';

  const props = withDefaults(defineProps<IridescenceProps>(), {
    color: () => [1, 1, 1],
    speed: 1,
    amplitude: 0.1,
    mouseReact: true,
    scale: 1,
    detail: 8,
    rotation: 0,
    warp: 1,
    hueShift: 0,
    saturation: 1,
    brightness: 1.5,
    contrast: 1,
    stir: 0.5,
    sheen: 0.3,
    clickSwirl: true,
    grain: 0,
    fade: 0,
    opacity: 1,
    resolution: 1,
    paused: false,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  let engine: IridescenceEngine | null = null;
  let inView = true;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';

  const settings = computed(() => toIridescenceSettings(props));

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
    resume();
  }

  function measure() {
    const el = containerRef.value;
    if (!el || !engine) return;
    engine.resize(el.clientWidth, el.clientHeight);
    wake();
  }

  useResizeObserver(containerRef, measure);

  useIntersectionObserver(containerRef, (entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    if (inView) {
      engine?.resetClock();
      wake();
    }
  });

  watch(visibility, () => {
    engine?.resetClock();
    wake();
  });

  watch([settings, reducedMotion], () => {
    if (!isActive.value) engine?.update();
    wake();
  });

  function locate(event: PointerEvent) {
    const el = containerRef.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / Math.max(1, rect.width),
      y: 1 - (event.clientY - rect.top) / Math.max(1, rect.height),
    };
  }

  function onPointerMove(event: PointerEvent) {
    const spot = locate(event);
    if (!spot || !engine) return;
    engine.pointerMove(spot.x, spot.y);
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    const spot = locate(event);
    if (!spot || !engine) return;
    if (engine.swirl(spot.x, spot.y)) wake();
  }

  function onPointerLeave() {
    engine?.pointerLeave();
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);

  onMounted(() => {
    rootEl.value = document.documentElement;
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createIridescenceEngine(canvas, () => settings.value, isReduced);
    if (!engine) {
      failed.value = true;
      return;
    }
    measure();
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
