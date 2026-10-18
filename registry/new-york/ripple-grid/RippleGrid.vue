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
    createRippleGridEngine,
    toRippleGridSettings,
  } from './ripple-grid-engine';
  import type { RippleGridEngine, RippleGridProps } from './types';

  const props = withDefaults(defineProps<RippleGridProps>(), {
    color: '#ffffff',
    variant: 'lines',
    cellSize: 48,
    lineWidth: 1,
    glow: 0.6,
    rippleStrength: 1,
    rippleSpeed: 1,
    rippleSize: 1,
    autoRipple: 'center',
    rippleInterval: 2.6,
    tilt: 0,
    rotation: 0,
    mouseInteraction: true,
    clickRipple: true,
    intro: true,
    fade: 0.5,
    opacity: 1,
    lightMode: false,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  let engine: RippleGridEngine | null = null;
  let inView = true;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';
  const settings = computed(() => toRippleGridSettings(props));

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

  watch([settings, reducedMotion], () => engine?.update(!isActive.value));

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
    if (at) engine?.pointerMove(at.x, at.y, at.inside);
  }

  function onPointerDown(event: PointerEvent) {
    const at = locate(event);
    if (at) engine?.pointerDown(at.x, at.y, at.inside);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);

  onMounted(() => {
    rootEl.value = document.documentElement;
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createRippleGridEngine(
      canvas,
      () => settings.value,
      isReduced,
      wake,
    );
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
