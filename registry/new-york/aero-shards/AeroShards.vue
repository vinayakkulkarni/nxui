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
  import { createAeroShardsEngine } from './aero-shards-engine';
  import {
    MARKER_STYLES,
    MATERIALS,
    PLACEMENTS,
    clamp,
    parseColor,
  } from './aero-shards-math';
  import type {
    AeroShardsEngine,
    AeroShardsProps,
    AeroShardsSettings,
    AeroShardsSpot,
  } from './types';

  const props = withDefaults(defineProps<AeroShardsProps>(), {
    shardColor: '#896ABD',
    accentColor: '#A855F7',
    backgroundColor: 'transparent',
    lightMode: false,
    placement: 'full',
    material: 'glass',
    markers: 'plus',
    count: 1300,
    shardSize: 1,
    spread: 1,
    twist: 1,
    billow: 1,
    speed: 1,
    scale: 1,
    depthOfField: 0.75,
    glow: 0.35,
    grain: 0.06,
    vignette: 0.3,
    intro: true,
    mouseInteraction: true,
    mouseStrength: 0.6,
    parallax: 0.5,
    pulseOnClick: true,
    holdToGather: true,
    paused: false,
    dpr: 2,
    class: '',
  });

  const emit = defineEmits<{
    error: [error: Error];
  }>();

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  let engine: AeroShardsEngine | null = null;
  let inView = true;
  let lost = false;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();

  const settings = computed<AeroShardsSettings>(() => ({
    shard: parseColor(props.shardColor, [0.54, 0.42, 0.74]) ?? [
      0.54, 0.42, 0.74,
    ],
    accent: parseColor(props.accentColor, [0.66, 0.33, 0.97]) ?? [
      0.66, 0.33, 0.97,
    ],
    paper: parseColor(props.backgroundColor, null),
    lightMode: props.lightMode,
    placement: Math.max(0, PLACEMENTS.indexOf(props.placement)),
    material: MATERIALS[props.material] ?? 0,
    count: Math.round(clamp(props.count, 100, 6000)),
    shardSize: clamp(props.shardSize, 0.2, 4),
    spread: clamp(props.spread, 0, 3),
    twist: clamp(props.twist, 0, 3),
    billow: clamp(props.billow, 0, 3),
    speed: clamp(props.speed, 0, 4),
    scale: clamp(props.scale, 0.4, 2.5),
    depthOfField: clamp(props.depthOfField, 0, 1),
    glow: clamp(props.glow, 0, 2),
    grain: clamp(props.grain, 0, 0.5),
    vignette: clamp(props.vignette, 0, 1),
    intro: props.intro,
    mouseInteraction: props.mouseInteraction,
    mouseStrength: clamp(props.mouseStrength, 0, 1),
    markers: MARKER_STYLES[props.markers] ?? -1,
    pulseOnClick: props.pulseOnClick,
    holdToGather: props.holdToGather,
    parallax: clamp(props.parallax, 0, 1),
    paused: props.paused,
    dpr: Math.max(0.5, props.dpr),
  }));

  const isReduced = () => reducedMotion.value === 'reduce';

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

  function refresh() {
    engine?.invalidate();
    wake();
  }

  useResizeObserver(containerRef, refresh);
  useIntersectionObserver(containerRef, (entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    wake();
  });
  watch(visibility, wake);
  watch(settings, refresh);
  watch(reducedMotion, refresh);

  function locate(event: PointerEvent): AeroShardsSpot | null {
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
    if (spot.inside) wake();
  }

  function onPointerDown(event: PointerEvent) {
    if (!engine || event.button !== 0 || isReduced()) return;
    if (!props.mouseInteraction) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        'a, button, input, textarea, select, label, [role="button"]',
      )
    ) {
      return;
    }
    const spot = locate(event);
    if (!spot || !spot.inside) return;
    engine.press(spot);
    wake();
  }

  function onPointerUp() {
    if (!engine) return;
    engine.release();
    wake();
  }

  function onLeave() {
    engine?.leave();
    wake();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    pause();
  }

  function start() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;
    try {
      engine = createAeroShardsEngine(canvas, container, () => settings.value, {
        reduced: isReduced,
        ratio: () => window.devicePixelRatio || 1,
      });
    } catch (error) {
      engine = null;
      emit('error', error instanceof Error ? error : new Error(String(error)));
      return;
    }
    wake();
  }

  function onContextRestored() {
    lost = false;
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
