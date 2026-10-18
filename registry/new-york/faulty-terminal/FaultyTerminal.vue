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
    createFaultyTerminalEngine,
    toSettings,
  } from './faulty-terminal-engine';
  import type { FaultyTerminalEngine, FaultyTerminalProps } from './types';

  const props = withDefaults(defineProps<FaultyTerminalProps>(), {
    scale: 1,
    gridMul: () => [2, 1],
    digitSize: 1.5,
    timeScale: 0.3,
    pause: false,
    scanlineIntensity: 0.3,
    glitchAmount: 1,
    flickerAmount: 1,
    noiseAmp: 1,
    chromaticAberration: 0,
    dither: 0,
    curvature: 0.2,
    tint: '#ffffff',
    mouseReact: true,
    mouseStrength: 0.2,
    pageLoadAnimation: true,
    brightness: 1,
    glyphs: 'blocks',
    glow: 0.5,
    persistence: 0.5,
    scramble: 0.5,
    mouseGlow: 0.6,
    vignette: 0.25,
    clickEffect: 'glitch',
    variation: undefined,
    lightMode: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  let engine: FaultyTerminalEngine | null = null;
  let visible = true;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';

  const settings = computed(() =>
    toSettings({
      scale: props.scale,
      gridMul: props.gridMul,
      digitSize: props.digitSize,
      timeScale: props.timeScale,
      pause: props.pause,
      scanlineIntensity: props.scanlineIntensity,
      glitchAmount: props.glitchAmount,
      flickerAmount: props.flickerAmount,
      noiseAmp: props.noiseAmp,
      chromaticAberration: props.chromaticAberration,
      dither: props.dither,
      curvature: props.curvature,
      tint: props.tint,
      mouseReact: props.mouseReact,
      mouseStrength: props.mouseStrength,
      pageLoadAnimation: props.pageLoadAnimation,
      brightness: props.brightness,
      glyphs: props.glyphs,
      glow: props.glow,
      persistence: props.persistence,
      scramble: props.scramble,
      mouseGlow: props.mouseGlow,
      vignette: props.vignette,
      clickEffect: props.clickEffect,
      lightMode: props.lightMode,
      dpr: props.dpr,
    }),
  );

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!engine || !visible || visibility.value === 'hidden') {
        pause();
        return;
      }
      if (!engine.frame(timestamp, isReduced())) pause();
    },
    { immediate: false },
  );

  function wake() {
    if (!engine) return;
    engine.wake(!isActive.value);
    if (!isActive.value && visible && visibility.value !== 'hidden') resume();
  }

  function measure() {
    const el = containerRef.value;
    if (!el || !engine) return;
    engine.resize(el.clientWidth, el.clientHeight, window.devicePixelRatio);
    wake();
  }

  useResizeObserver(containerRef, measure);

  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
  });

  watch(visibility, wake);
  watch(settings, wake);

  function locate(event: PointerEvent) {
    const el = containerRef.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
    const y = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
    return { x, y, inside: x >= 0 && x <= 1 && y >= 0 && y <= 1 };
  }

  function onPointerMove(event: PointerEvent) {
    const point = locate(event);
    if (point && engine?.pointerMove(point.x, point.y, point.inside)) wake();
  }

  function onPointerDown(event: PointerEvent) {
    const point = locate(event);
    if (!point?.inside || !engine) return;
    if (engine.click(point.x, point.y, isReduced())) wake();
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
    engine = createFaultyTerminalEngine(
      canvas,
      () => settings.value,
      props.variation,
      isReduced(),
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
