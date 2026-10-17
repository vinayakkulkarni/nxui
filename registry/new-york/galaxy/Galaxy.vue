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
  import { createGalaxyEngine, toGalaxySettings } from './galaxy-engine';
  import type { GalaxyEngine, GalaxyProps } from './types';

  const props = withDefaults(defineProps<GalaxyProps>(), {
    focal: () => [0.5, 0.5],
    rotation: () => [1, 0],
    starSpeed: 0.5,
    density: 1,
    hueShift: 140,
    disableAnimation: false,
    speed: 1,
    mouseInteraction: true,
    glowIntensity: 0.3,
    saturation: 0,
    mouseRepulsion: true,
    repulsionStrength: 2,
    twinkleIntensity: 0.3,
    rotationSpeed: 0.1,
    autoCenterRepulsion: 0,
    transparent: true,
    lightMode: false,
    starColors: undefined,
    starSize: 1,
    flareIntensity: 1,
    layers: 4,
    direction: 'forward',
    clickWarp: true,
    intro: true,
    backgroundColor: undefined,
    opacity: 1,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  let engine: GalaxyEngine | null = null;
  let inView = true;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';

  const settings = computed(() => toGalaxySettings(props));

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!engine || visibility.value === 'hidden') {
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
    engine?.setVisible(inView);
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

  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event.pointerType === 'mouse');
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);

  onMounted(() => {
    rootEl.value = document.documentElement;
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createGalaxyEngine(canvas, () => settings.value, isReduced, wake);
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
