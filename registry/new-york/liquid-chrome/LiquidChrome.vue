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
    createLiquidChromeEngine,
    parseChromeColor,
  } from './liquid-chrome-engine';
  import type {
    LiquidChromeEngine,
    LiquidChromeProps,
    LiquidChromeSettings,
    LiquidChromeSpot,
  } from './types';

  const props = withDefaults(defineProps<LiquidChromeProps>(), {
    color: '#ffffff',
    speed: 0.2,
    amplitude: 0.3,
    frequencyX: 3,
    frequencyY: 3,
    detail: 4,
    thickness: 1,
    depth: 1,
    roughness: 0.3,
    exposure: 1,
    interactive: true,
    rippleStrength: 1,
    rippleSize: 1,
    tilt: 1,
    intro: true,
    lightMode: false,
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  let engine: LiquidChromeEngine | null = null;
  let inView = true;
  let lost = false;
  let generation = 0;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const settings = computed<LiquidChromeSettings>(() => {
    const [r, g, b] = parseChromeColor(props.color);
    return {
      tint: [r ** 2.2, g ** 2.2, b ** 2.2],
      speed: Math.max(0, props.speed),
      amplitude: clamp(props.amplitude, 0, 2),
      frequency: [
        Math.max(0.1, props.frequencyX),
        Math.max(0.1, props.frequencyY),
      ],
      detail: clamp(Math.round(props.detail), 1, 8),
      thickness: clamp(props.thickness, 0.25, 4),
      depth: Math.max(0, props.depth),
      roughness: clamp(props.roughness, 0, 1),
      exposure: Math.max(0, props.exposure),
      interactive: props.interactive,
      rippleStrength: Math.max(0, props.rippleStrength),
      rippleSize: clamp(props.rippleSize, 0.2, 4),
      tilt: Math.max(0, props.tilt),
      light: props.lightMode,
      maxRatio: clamp(props.maxDevicePixelRatio, 0.5, 3),
    };
  });

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!engine || lost || !inView || visibility.value === 'hidden') {
        pause();
        return;
      }
      if (!engine.frame(timestamp)) pause();
    },
    { immediate: false },
  );

  function wake() {
    if (!engine || lost || isActive.value || !inView) return;
    if (visibility.value === 'hidden') return;
    engine.resetClock();
    resume();
  }

  function measure() {
    const el = containerRef.value;
    if (!el || !engine) return;
    const rect = el.getBoundingClientRect();
    engine.resize(rect.width, rect.height);
    wake();
  }

  useResizeObserver(containerRef, measure);

  useIntersectionObserver(containerRef, (entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    wake();
  });

  watch(visibility, wake);
  watch(settings, measure);

  function locate(event: PointerEvent): LiquidChromeSpot | null {
    const el = containerRef.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      u: (event.clientX - rect.left) / Math.max(1, rect.width),
      v: (event.clientY - rect.top) / Math.max(1, rect.height),
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
    engine.move(spot);
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    const spot = locate(event);
    if (!spot || !engine || !spot.inside) return;
    engine.press(spot);
    wake();
  }

  function onLeave() {
    engine?.leave();
    wake();
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') onLeave();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    pause();
  }

  function start() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const reduced =
      reducedMotion.value === 'reduce' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    engine = createLiquidChromeEngine(canvas, () => settings.value, {
      reduced,
      rise: props.intro && generation === 0,
      ratio: () => window.devicePixelRatio || 1,
    });
    measure();
  }

  function onContextRestored() {
    lost = false;
    generation += 1;
    engine?.destroy();
    engine = null;
    start();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootEl, 'pointerleave', onLeave);
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  onMounted(() => {
    rootEl.value = document.documentElement;
    start();
  });

  onBeforeUnmount(() => {
    pause();
    engine?.destroy();
    engine = null;
    canvasRef.value
      ?.getContext('webgl2')
      ?.getExtension('WEBGL_lose_context')
      ?.loseContext();
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
