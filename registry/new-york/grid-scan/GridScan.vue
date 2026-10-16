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
  import { createGridScanEngine } from './grid-scan-engine';
  import {
    GRID_SCAN_MODELS_URL,
    GRID_SCAN_STATUS_LABELS,
    startHeadTracking,
  } from './grid-scan-face';
  import { toSettings } from './grid-scan-gl';
  import type {
    GridScanEngine,
    GridScanPointer,
    GridScanProps,
    GridScanStatus,
  } from './types';

  const props = withDefaults(defineProps<GridScanProps>(), {
    linesColor: undefined,
    scanColor: undefined,
    cells: 8,
    lineThickness: 1,
    lineStyle: 'solid',
    depth: 3,
    depthFade: 0.6,
    parallax: 1,
    points: true,
    reflection: 0.35,
    shading: 0.7,
    scanDirection: 'forward',
    scanDuration: 2.4,
    scanDelay: 1.6,
    scanWidth: 1,
    trail: 0.5,
    glow: 0.6,
    autoScan: true,
    interactive: true,
    clickEffect: 'ping',
    enableWebcam: false,
    showPreview: false,
    modelsPath: GRID_SCAN_MODELS_URL,
    enableGyro: false,
    intro: true,
    lightMode: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const videoRef = ref<HTMLVideoElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  const failed = ref(false);
  const status = ref<GridScanStatus>('loading');
  let engine: GridScanEngine | null = null;
  let inView = true;
  let gyroAsked = false;
  let stopTracking: (() => void) | null = null;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const isReduced = () => reducedMotion.value === 'reduce';

  const settings = computed(() => toSettings(props));
  const statusLabel = computed(() => GRID_SCAN_STATUS_LABELS[status.value]);

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

  watch(settings, wake);
  watch(() => props.dpr, measure);

  function locate(event: PointerEvent): GridScanPointer | null {
    const el = containerRef.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const u = (event.clientX - rect.left) / Math.max(1, rect.width);
    const v = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
    return { u, v, inside: u >= 0 && u <= 1 && v >= 0 && v <= 1 };
  }

  function onPointerMove(event: PointerEvent) {
    const point = locate(event);
    if (point) engine?.pointerMove(point);
  }

  function onPointerDown(event: PointerEvent) {
    const point = locate(event);
    if (point) engine?.pointerDown(point);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  function onOrientation(event: DeviceOrientationEvent) {
    engine?.orientation(event.gamma, event.beta);
  }

  function onClick() {
    if (!settings.value.enableGyro || gyroAsked) return;
    if (typeof DeviceOrientationEvent === 'undefined') return;
    const request: unknown = Reflect.get(
      DeviceOrientationEvent,
      'requestPermission',
    );
    if (typeof request !== 'function') return;
    gyroAsked = true;
    Promise.resolve(Reflect.apply(request, DeviceOrientationEvent, [])).catch(
      () => {},
    );
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('deviceorientation', onOrientation);
  useEventListener('click', onClick);
  useEventListener(rootEl, 'pointerleave', onPointerLeave);

  function syncTracking() {
    stopTracking?.();
    stopTracking = null;
    const video = videoRef.value;
    if (!engine || !props.enableWebcam || !video) return;
    stopTracking = startHeadTracking(
      video,
      props.modelsPath,
      engine,
      (value) => {
        status.value = value;
      },
    );
  }

  watch([() => props.enableWebcam, () => props.modelsPath], syncTracking, {
    flush: 'post',
  });

  onMounted(() => {
    rootEl.value = document.documentElement;
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createGridScanEngine(
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
    syncTracking();
  });

  onBeforeUnmount(() => {
    pause();
    stopTracking?.();
    stopTracking = null;
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
    <div
      v-if="props.enableWebcam"
      :class="props.showPreview ? 'grid-scan-preview' : 'grid-scan-hidden'"
    >
      <video ref="videoRef" class="grid-scan-video" muted playsinline />
      <span v-if="props.showPreview" class="grid-scan-status" role="status">
        {{ statusLabel }}
      </span>
    </div>
  </div>
</template>

<style scoped>
  .grid-scan-preview {
    position: absolute;
    right: 12px;
    bottom: 12px;
    width: 168px;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 14px;
    background: #0b0b0e;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.08),
      0 8px 24px rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }

  .grid-scan-video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }

  .grid-scan-status {
    position: absolute;
    left: 8px;
    bottom: 8px;
    padding: 3px 8px;
    border-radius: 8px;
    background: rgba(10, 10, 12, 0.6);
    color: #ffffff;
    font:
      500 11px/1.4 system-ui,
      -apple-system,
      sans-serif;
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }

  .grid-scan-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }
</style>
