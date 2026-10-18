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
  import { createThreadsEngine, toThreadsSettings } from './threads-engine';
  import type { ThreadsEngine, ThreadsProps } from './types';

  const props = withDefaults(defineProps<ThreadsProps>(), {
    color: () => [1, 1, 1],
    accentColor: undefined,
    amplitude: 1.7,
    distance: 0.4,
    enableMouseInteraction: false,
    lineCount: 90,
    thickness: 0.6,
    softness: 1.3,
    speed: 0.6,
    waves: 1.05,
    split: 0.04,
    fray: 0.5,
    angle: 25,
    seed: 0,
    parting: 0,
    taper: 0.85,
    brightness: 1.4,
    fade: 0,
    opacity: 1,
    paused: false,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  let engine: ThreadsEngine | null = null;
  let inView = true;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';

  const settings = computed(() => toThreadsSettings(props));

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

  watch([settings, reducedMotion], () => {
    if (!isActive.value) engine?.render();
    wake();
  });

  function onPointerMove(event: PointerEvent) {
    const el = containerRef.value;
    if (!el || !engine) return;
    const rect = el.getBoundingClientRect();
    engine.pointerMove(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
    );
    wake();
  }

  function onPointerLeave() {
    engine?.pointerLeave();
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);

  onMounted(() => {
    rootEl.value = document.documentElement;
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createThreadsEngine(canvas, () => settings.value, isReduced);
    if (!engine) {
      failed.value = true;
      return;
    }
    measure();
    wake();
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
