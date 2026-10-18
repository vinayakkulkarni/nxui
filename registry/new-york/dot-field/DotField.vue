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
  import { createDotFieldEngine } from './dot-field-engine';
  import { toSettings } from './dot-field-math';
  import type { DotFieldEngine, DotFieldProps } from './types';

  const props = withDefaults(defineProps<DotFieldProps>(), {
    dotRadius: 1.5,
    dotSpacing: 14,
    pattern: 'grid',
    gradientFrom: '#5227FF',
    gradientTo: '#FF9FFC',
    gradientAngle: 135,
    cursorRadius: 240,
    bulgeStrength: 0.6,
    twist: 0,
    glowColor: '#ffffff',
    glowRadius: 160,
    glowIntensity: 0.8,
    baseOpacity: 0.55,
    waveAmplitude: 0,
    sparkle: false,
    speed: 1,
    interactive: true,
    holdToZoom: true,
    intro: true,
    lightMode: false,
    opacity: 1,
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const canvasEl = shallowRef<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  let engine: DotFieldEngine | null = null;
  let visible = true;
  let generation = 0;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';

  const settings = computed(() =>
    toSettings({
      dotRadius: props.dotRadius,
      dotSpacing: props.dotSpacing,
      pattern: props.pattern,
      gradientFrom: props.gradientFrom,
      gradientTo: props.gradientTo,
      gradientAngle: props.gradientAngle,
      cursorRadius: props.cursorRadius,
      bulgeStrength: props.bulgeStrength,
      twist: props.twist,
      glowColor: props.glowColor,
      glowRadius: props.glowRadius,
      glowIntensity: props.glowIntensity,
      baseOpacity: props.baseOpacity,
      waveAmplitude: props.waveAmplitude,
      sparkle: props.sparkle,
      speed: props.speed,
      interactive: props.interactive,
      holdToZoom: props.holdToZoom,
      intro: props.intro,
      lightMode: props.lightMode,
      opacity: props.opacity,
      maxDevicePixelRatio: props.maxDevicePixelRatio,
    }),
  );

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!engine || !engine.frame(timestamp)) pause();
    },
    { immediate: false },
  );

  function wake() {
    if (!engine || isActive.value || !visible || visibility.value === 'hidden')
      return;
    engine.start(performance.now());
    resume();
  }

  function measure() {
    const el = containerRef.value;
    if (!el || !engine) return;
    const rect = el.getBoundingClientRect();
    engine.resize(rect.width, rect.height, window.devicePixelRatio);
    wake();
  }

  function stopIfHidden() {
    if (!visible || visibility.value === 'hidden') pause();
    else wake();
  }

  useResizeObserver(containerRef, measure);
  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    stopIfHidden();
  });
  watch(visibility, stopIfHidden);
  watch(settings, measure);

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
    if (!spot) return;
    engine?.pointer(spot.x, spot.y, spot.inside);
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    const spot = locate(event);
    if (!spot) return;
    engine?.pointer(spot.x, spot.y, spot.inside, spot.inside);
    wake();
  }

  function onPointerUp(event: PointerEvent) {
    engine?.release(event.pointerType === 'mouse');
    wake();
  }

  function onLeave() {
    engine?.leave();
    wake();
  }

  function build() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createDotFieldEngine(
      canvas,
      () => settings.value,
      isReduced,
      generation > 0,
    );
    if (!engine) {
      failed.value = true;
      return;
    }
    measure();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    pause();
  }

  function onContextRestored() {
    engine = null;
    generation += 1;
    build();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootEl, 'pointerleave', onLeave);
  useEventListener(canvasEl, 'webglcontextlost', onContextLost);
  useEventListener(canvasEl, 'webglcontextrestored', onContextRestored);

  onMounted(() => {
    rootEl.value = document.documentElement;
    canvasEl.value = canvasRef.value;
    build();
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
