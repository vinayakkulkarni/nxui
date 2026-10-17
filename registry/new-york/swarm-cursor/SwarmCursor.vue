<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    shallowRef,
    useTemplateRef,
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
    MAX_PARTICLES,
    SHAPES,
    clamp,
    createSwarmEngine,
  } from './swarm-engine';
  import type {
    SwarmCursorProps,
    SwarmCursorSettings,
    SwarmEngine,
  } from './types';

  const props = withDefaults(defineProps<SwarmCursorProps>(), {
    count: 800,
    size: 2.6,
    shape: 'dot',
    color: undefined,
    accentColor: undefined,
    spread: 90,
    speed: 1,
    swirl: 0.6,
    tail: 0.5,
    trail: 0.6,
    wander: 0.5,
    depth: 0.7,
    targets: 'a, button, [data-swarm-target]',
    idle: 'roam',
    clickEffect: 'burst',
    hideCursor: false,
    intro: true,
    enabled: true,
    lightMode: false,
    dpr: undefined,
    class: '',
    style: undefined,
  });

  const settings = computed<SwarmCursorSettings>(() => {
    const ink = props.lightMode ? '#18181b' : '#ffffff';
    return {
      count: Math.round(clamp(props.count, 1, MAX_PARTICLES)),
      size: clamp(props.size, 0.5, 16),
      shape: SHAPES[props.shape] ?? 0,
      color: props.color || ink,
      accentColor: props.accentColor || props.color || ink,
      spread: clamp(props.spread, 20, 400),
      speed: clamp(props.speed, 0, 4),
      swirl: clamp(props.swirl, 0, 1),
      tail: clamp(props.tail, 0, 1),
      trail: clamp(props.trail, 0, 3),
      wander: clamp(props.wander, 0, 2),
      depth: clamp(props.depth, 0, 1),
      targets: props.targets,
      idle: props.idle,
      clickEffect: props.clickEffect,
      hideCursor: props.hideCursor,
      intro: props.intro,
      enabled: props.enabled,
      lightMode: props.lightMode,
      dpr: props.dpr,
    };
  });

  const containerRef = useTemplateRef<HTMLDivElement>('container');
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const rootElement = shallowRef<HTMLElement | null>(null);
  const engine = shallowRef<SwarmEngine | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const documentVisibility = useDocumentVisibility();
  let visible = true;

  const isReduced = (): boolean => reducedMotion.value === 'reduce';
  const readSettings = (): SwarmCursorSettings => settings.value;

  function setHidden(value: boolean) {
    containerRef.value?.classList.toggle('swarm-cursor-hidden', value);
  }

  const { pause, resume } = useRafFn(
    ({ timestamp }) => {
      const current = engine.value;
      if (
        !current ||
        !visible ||
        documentVisibility.value !== 'visible' ||
        !current.frame(timestamp)
      )
        pause();
    },
    { immediate: false },
  );

  function wake() {
    if (engine.value && visible && documentVisibility.value === 'visible')
      resume();
  }

  function onResize() {
    engine.value?.resize();
    wake();
  }

  function onPointerMove(event: PointerEvent) {
    engine.value?.pointerMove(event);
  }

  function onPointerDown(event: PointerEvent) {
    engine.value?.pointerDown(event);
  }

  function onPointerUp(event: PointerEvent) {
    engine.value?.pointerUp(event);
  }

  function onPointerLeave() {
    engine.value?.pointerLeave();
  }

  useResizeObserver(containerRef, onResize);
  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      engine.value?.resetClock();
      wake();
    }
  });
  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootElement, 'pointerleave', onPointerLeave);

  watch(documentVisibility, () => {
    engine.value?.resetClock();
    wake();
  });
  watch([settings, reducedMotion], wake);

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    rootElement.value = document.documentElement;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return;
    engine.value = createSwarmEngine({
      gl,
      canvas,
      container,
      settings: readSettings,
      reduce: isReduced,
      setHidden,
    });
    onResize();
  });

  onBeforeUnmount(() => {
    pause();
    engine.value?.dispose();
    engine.value = null;
  });
</script>

<template>
  <div
    ref="container"
    :class="cn('swarm-cursor relative size-full overflow-hidden', props.class)"
    :style="props.style"
  >
    <canvas
      ref="canvas"
      class="pointer-events-none absolute inset-0 block size-full"
      aria-hidden="true"
    />
    <div v-if="$slots.default" class="relative size-full">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .swarm-cursor-hidden,
  .swarm-cursor-hidden :deep(*) {
    cursor: none !important;
  }
</style>
