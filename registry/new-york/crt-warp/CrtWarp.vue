<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { createCrtWarpEngine } from './crt-warp-engine';
  import { toSettings } from './crt-warp-gl';
  import type { CrtWarpEngine, CrtWarpProps } from './types';

  const props = withDefaults(defineProps<CrtWarpProps>(), {
    color: '#c755f7',
    backgroundColor: '#120f17',
    lightMode: false,
    speed: 0.5,
    variation: 0,
    waveAmplitude: 0.3,
    waveFrequency: 2.5,
    levels: 3,
    columns: 80,
    persistence: 0.4,
    curvature: 0.25,
    corners: 0,
    scanlineStrength: 0.6,
    scanlineFrequency: 200,
    mask: 'aperture',
    maskStrength: 0.3,
    bloom: 1.5,
    bloomRadius: 1,
    rgbShift: 0.003,
    noise: 0.1,
    flicker: 0.15,
    interference: 0.2,
    vignette: 0.3,
    brightness: 1,
    intro: true,
    mouseReact: true,
    mouseStrength: 0.5,
    changeOnClick: true,
    dpr: 2,
    fps: 60,
    paused: false,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  let engine: CrtWarpEngine | null = null;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';

  const settings = computed(() =>
    toSettings(
      {
        color: props.color,
        backgroundColor: props.backgroundColor,
        lightMode: props.lightMode,
        mask: props.mask,
        speed: props.speed,
        variation: props.variation,
        waveAmplitude: props.waveAmplitude,
        waveFrequency: props.waveFrequency,
        levels: props.levels,
        columns: props.columns,
        persistence: props.persistence,
        curvature: props.curvature,
        corners: props.corners,
        scanlineStrength: props.scanlineStrength,
        scanlineFrequency: props.scanlineFrequency,
        maskStrength: props.maskStrength,
        bloom: props.bloom,
        bloomRadius: props.bloomRadius,
        rgbShift: props.rgbShift,
        noise: props.noise,
        flicker: props.flicker,
        interference: props.interference,
        vignette: props.vignette,
        brightness: props.brightness,
      },
      {
        intro: props.intro,
        mouseReact: props.mouseReact,
        mouseStrength: props.mouseStrength,
        changeOnClick: props.changeOnClick,
        dpr: props.dpr,
        fps: props.fps,
        paused: props.paused,
      },
    ),
  );

  const { pause, resume } = useRafFn(
    ({ timestamp }) => {
      if (!engine || visibility.value === 'hidden') return;
      engine.frame(timestamp, isReduced());
    },
    { immediate: false },
  );

  function measure() {
    const el = containerRef.value;
    if (!el || !engine) return;
    engine.resize(el.clientWidth, el.clientHeight);
  }

  useResizeObserver(containerRef, measure);

  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function local(event: PointerEvent) {
    const el = containerRef.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / Math.max(rect.width, 1),
      y: (event.clientY - rect.top) / Math.max(rect.height, 1),
      inside:
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom,
    };
  }

  function onMove(event: PointerEvent) {
    const point = local(event);
    if (point) engine?.pointerMove(point.x, point.y, point.inside);
  }

  function onLeave() {
    engine?.pointerLeave();
  }

  function onDown(event: PointerEvent) {
    if (!engine || !settings.value.changeOnClick || event.button !== 0) return;
    if (
      event.target instanceof Element &&
      event.target.closest(
        'a, button, input, textarea, select, label, [role="button"]',
      )
    )
      return;
    const point = local(event);
    if (!point?.inside) return;
    engine.flipChannel(isReduced());
  }

  useEventListener('pointermove', onMove, { passive: true });
  useEventListener('pointerdown', onDown);
  useEventListener(rootEl, 'pointerleave', onLeave);

  onMounted(() => {
    rootEl.value = document.documentElement;
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createCrtWarpEngine(canvas, () => settings.value);
    if (!engine) {
      failed.value = true;
      return;
    }
    measure();
    resume();
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
    :class="['relative size-full overflow-hidden', props.class]"
  >
    <canvas
      v-if="!failed"
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
