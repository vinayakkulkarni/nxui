<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    MAGNET_LINES_MODES,
    clamp,
    createMagnetLinesEngine,
    lightness,
    parseColor,
  } from './magnet-lines-gl';
  import type {
    MagnetLinesEngine,
    MagnetLinesProps,
    MagnetLinesSettings,
  } from './types';

  const props = withDefaults(defineProps<MagnetLinesProps>(), {
    spacing: 30,
    rows: undefined,
    columns: undefined,
    containerSize: undefined,
    lineColor: '#efefef',
    accentColor: undefined,
    lineWidth: 2,
    lineHeight: 18,
    baseAngle: -10,
    mode: 'orbit',
    shape: 'line',
    rainbow: false,
    radius: 200,
    fade: 0.65,
    edgeFade: 0,
    stretch: 0.4,
    reach: 0,
    scatter: 0,
    inertia: 0.35,
    bounce: 0.3,
    ripple: 0.3,
    clickPulse: true,
    intro: true,
    idle: false,
    tiltX: 0,
    tiltY: 0,
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const probeRef = ref<HTMLSpanElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const size = computed(() =>
    typeof props.containerSize === 'number'
      ? `${props.containerSize}px`
      : props.containerSize,
  );
  const square = computed(() => Boolean(size.value));
  const rootStyle = computed(() =>
    square.value ? { width: size.value } : undefined,
  );

  const settings = computed<MagnetLinesSettings>(() => {
    const color = parseColor(props.lineColor);
    const accent = props.accentColor ? parseColor(props.accentColor) : null;
    return {
      square: square.value,
      spacing: Math.max(4, Number(props.spacing) || 30),
      rows: props.rows ? clamp(Math.round(props.rows), 1, 400) : 0,
      columns: props.columns ? clamp(Math.round(props.columns), 1, 400) : 0,
      lineWidth: props.lineWidth,
      lineHeight: props.lineHeight,
      baseAngle: (props.baseAngle * Math.PI) / 180,
      mode: MAGNET_LINES_MODES.includes(props.mode) ? props.mode : 'orbit',
      shape: props.shape,
      color,
      accent:
        accent ?? (props.shape === 'needle' ? parseColor('#f43f5e') : color),
      accentMix: accent ? 1 : 0,
      rainbow: props.rainbow,
      tone: clamp(lightness(color), 0.42, 0.66),
      radius: Math.max(1, props.radius),
      fade: clamp(props.fade, 0, 1),
      edgeFade: clamp(props.edgeFade, 0, 1),
      stretch: clamp(props.stretch, 0, 2),
      reach: Math.max(0, props.reach),
      scatter: clamp(props.scatter, 0, 1),
      inertia: clamp(props.inertia, 0, 1),
      bounce: clamp(props.bounce, 0, 1),
      ripple: clamp(props.ripple, 0, 1),
      clickPulse: props.clickPulse,
      idle: props.idle,
      tiltX: clamp(props.tiltX, -70, 70),
      tiltY: clamp(props.tiltY, -70, 70),
      maxRatio: clamp(props.maxDevicePixelRatio, 0.5, 3),
    };
  });

  let engine: MagnetLinesEngine | null = null;

  function getSettings(): MagnetLinesSettings {
    return settings.value;
  }

  function start(intro: boolean) {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    const probe = probeRef.value;
    if (!container || !canvas || !probe) return;
    engine?.dispose();
    engine = createMagnetLinesEngine({
      container,
      canvas,
      probe,
      getSettings,
      intro,
      reduce: reducedMotion.value === 'reduce',
      onRestored,
    });
  }

  // A restored WebGL context gets a fresh engine, without replaying the intro.
  function onRestored() {
    start(false);
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event.clientX, event.clientY);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event.clientX, event.clientY);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  function onResize() {
    engine?.refresh();
  }

  function onVisibility() {
    engine?.visibilityChanged();
  }

  onMounted(() => {
    start(props.intro);
    useEventListener('pointermove', onPointerMove, { passive: true });
    useEventListener('pointerdown', onPointerDown, { passive: true });
    useEventListener('resize', onResize);
    useEventListener(document.documentElement, 'pointerleave', onPointerLeave);
    useEventListener(document, 'visibilitychange', onVisibility);
  });

  useResizeObserver(containerRef, onResize);

  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(settings, () => engine?.refresh());

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('magnet-lines', square && 'magnet-lines--square', props.class)"
    :style="rootStyle"
  >
    <canvas ref="canvasRef" class="magnet-lines__canvas" aria-hidden="true" />
    <span ref="probeRef" class="magnet-lines__probe" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .magnet-lines {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .magnet-lines--square {
    height: auto;
    max-width: 100%;
    aspect-ratio: 1 / 1;
    overflow: visible;
  }

  .magnet-lines__canvas {
    position: absolute;
    display: block;
    pointer-events: none;
  }

  .magnet-lines__probe {
    position: absolute;
    top: 0;
    left: 0;
    height: 0;
    visibility: hidden;
    pointer-events: none;
  }
</style>
