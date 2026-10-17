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
  import {
    clamp,
    createMagicRingsEngine,
    linearRgb,
    normalizeMotion,
    parseColor,
  } from './magic-rings-gl';
  import { MAX_RINGS } from './magic-rings-shaders';
  import type {
    MagicRingsEngine,
    MagicRingsPointer,
    MagicRingsProps,
    MagicRingsSettings,
  } from './types';

  const props = withDefaults(defineProps<MagicRingsProps>(), {
    color: '#A855F7',
    colorTwo: '#6366F1',
    ringCount: 6,
    motion: 'pulse',
    speed: 1,
    lineThickness: 2,
    glow: 1,
    baseRadius: 0.35,
    radiusStep: 0.1,
    expansion: 0.1,
    taper: 1.5,
    rotation: 0,
    spin: 0,
    tilt: 0,
    dispersion: 0,
    grain: 0,
    opacity: 1,
    followMouse: false,
    mouseInfluence: 0.2,
    hoverScale: 1.2,
    hoverIntensity: 1,
    parallax: 0.05,
    clickBurst: true,
    intro: true,
    theme: 'dark',
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const rootRef = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const pageVisibility = useDocumentVisibility();
  let engine: MagicRingsEngine | null = null;
  let disposed = false;

  const settings = computed<MagicRingsSettings>(() => {
    const light = props.theme === 'light';
    const first = parseColor(props.color);
    const second = parseColor(props.colorTwo);
    return {
      color: light ? first : linearRgb(first),
      colorTwo: light ? second : linearRgb(second),
      ringCount: clamp(Math.round(props.ringCount), 1, MAX_RINGS),
      motion: normalizeMotion(props.motion),
      speed: Math.max(0, props.speed),
      lineThickness: Math.max(0.25, props.lineThickness),
      glow: clamp(props.glow, 0, 3),
      baseRadius: Math.max(0.01, props.baseRadius),
      radiusStep: Math.max(0, props.radiusStep),
      expansion: props.expansion,
      taper: Math.max(0.5, props.taper),
      rotation: (props.rotation * Math.PI) / 180,
      spin: props.spin,
      tilt: clamp(props.tilt, -80, 80),
      dispersion: clamp(props.dispersion, 0, 1),
      grain: clamp(props.grain, 0, 1),
      opacity: clamp(props.opacity, 0, 1),
      followMouse: props.followMouse,
      mouseInfluence: props.mouseInfluence,
      hoverScale: Math.max(0.5, props.hoverScale),
      hoverIntensity: Math.max(0, props.hoverIntensity),
      parallax: props.parallax,
      clickBurst: props.clickBurst,
      intro: props.intro,
      light,
      maxRatio: clamp(props.maxDevicePixelRatio, 0.5, 3),
    };
  });

  function readSettings(): MagicRingsSettings {
    return settings.value;
  }

  function start(firstRun: boolean) {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas || disposed) return;
    engine = createMagicRingsEngine(
      container,
      canvas,
      readSettings,
      reducedMotion.value === 'reduce',
      firstRun,
      onContextRestored,
    );
    engine?.setPageVisible(pageVisibility.value !== 'hidden');
  }

  function onContextRestored() {
    engine?.destroy();
    engine = null;
    start(false);
  }

  function onPointerMove(event: MagicRingsPointer) {
    engine?.pointerMove(event);
  }

  function onPointerDown(event: MagicRingsPointer) {
    engine?.pointerDown(event);
  }

  function onPointerUp(event: MagicRingsPointer) {
    engine?.pointerUp(event);
  }

  function onLeave() {
    engine?.leave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootRef, 'pointerleave', onLeave);

  useResizeObserver(containerRef, () => {
    engine?.resize();
    engine?.wake();
  });

  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(pageVisibility, (state) => {
    engine?.setPageVisible(state !== 'hidden');
  });

  watch(settings, () => {
    engine?.resize();
    engine?.wake();
  });

  onMounted(() => {
    rootRef.value = document.documentElement;
    start(true);
  });

  onBeforeUnmount(() => {
    disposed = true;
    engine?.destroy();
    engine?.loseContext();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
