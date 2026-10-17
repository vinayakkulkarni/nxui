<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { createShapeWaves } from './create-shape-waves';
  import type {
    ShapeWavesEngine,
    ShapeWavesProps,
    ShapeWavesSettings,
  } from './types';

  const props = withDefaults(defineProps<ShapeWavesProps>(), {
    text: '',
    fontFamily: 'Geist, "Geist Sans", system-ui, sans-serif',
    fontWeight: 500,
    textSize: 0.6,
    shapes: 'mixed',
    cellSize: 10,
    dotSize: 0.75,
    color: '#929292',
    hoverColor: '#ffffff',
    backgroundColor: '#000000',
    speed: 1,
    scale: 1,
    contrast: 1,
    brightness: 0.4,
    flow: 0,
    direction: 0,
    fade: 0.25,
    interactive: true,
    splashRadius: 40,
    splashStrength: 0.4,
    glow: 0.35,
    intro: true,
    introDuration: 1.6,
    introKey: 0,
    paused: false,
    class: '',
  });

  const emit = defineEmits<{ error: [error: Error] }>();

  const rootRef = useTemplateRef<HTMLDivElement>('root');
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const ready = ref(false);
  const reducedMotion = usePreferredReducedMotion();
  const documentVisibility = useDocumentVisibility();
  let engine: ShapeWavesEngine | undefined;

  const settings = computed<ShapeWavesSettings>(() => ({
    text: String(props.text ?? ''),
    fontFamily: props.fontFamily,
    fontWeight: props.fontWeight,
    textSize: props.textSize,
    shapes: props.shapes,
    cellSize: Math.max(2, props.cellSize),
    dotSize: props.dotSize,
    color: props.color,
    hoverColor: props.hoverColor,
    backgroundColor: props.backgroundColor,
    speed: props.speed,
    scale: Math.max(0.05, props.scale),
    contrast: props.contrast,
    brightness: props.brightness,
    flow: props.flow,
    direction: props.direction,
    fade: props.fade,
    interactive: props.interactive,
    splashRadius: props.splashRadius,
    splashStrength: props.splashStrength,
    glow: props.glow,
    intro: props.intro,
    introDuration: Math.max(0.1, props.introDuration),
    paused: props.paused,
  }));

  const settingsSignature = computed(() =>
    [
      props.shapes,
      props.cellSize,
      props.dotSize,
      props.color,
      props.hoverColor,
      props.backgroundColor,
      props.speed,
      props.scale,
      props.contrast,
      props.brightness,
      props.flow,
      props.direction,
      props.fade,
      props.interactive,
      props.splashRadius,
      props.splashStrength,
      props.glow,
      props.intro,
      props.introDuration,
      props.paused,
    ].join('|'),
  );
  const maskSignature = computed(() =>
    [props.text, props.fontFamily, props.fontWeight, props.textSize].join('|'),
  );

  watch(settingsSignature, () => engine?.applySettings());
  watch(maskSignature, () => engine?.applyMask());
  watch(
    () => props.introKey,
    (key) => {
      if (key) engine?.replayIntro();
    },
  );
  watch([documentVisibility, reducedMotion], () => engine?.wake());

  function handlePointerMove(event: PointerEvent) {
    engine?.pointerMove(event.clientX, event.clientY);
  }

  function handleScroll() {
    engine?.invalidateBounds();
  }

  useEventListener('pointermove', handlePointerMove, { passive: true });
  useEventListener('scroll', handleScroll, { capture: true, passive: true });

  useResizeObserver(rootRef, () => engine?.resize());

  useIntersectionObserver(
    rootRef,
    (entries) => {
      engine?.setVisible(entries.some((entry) => entry.isIntersecting));
    },
    { threshold: 0 },
  );

  onMounted(() => {
    const root = rootRef.value;
    const canvas = canvasRef.value;
    if (!root || !canvas) return;
    engine = createShapeWaves({
      root,
      canvas,
      getSettings: () => settings.value,
      isHidden: () => documentVisibility.value === 'hidden',
      prefersReducedMotion: () => reducedMotion.value === 'reduce',
      onReady: () => {
        ready.value = true;
      },
      onError: (error) => {
        ready.value = false;
        emit('error', error);
      },
    });
  });

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = undefined;
  });
</script>

<template>
  <div
    ref="root"
    :class="['shape-waves size-full', props.class]"
    :data-ready="ready"
    :style="{ backgroundColor: props.backgroundColor }"
    aria-hidden="true"
  >
    <canvas ref="canvas" class="shape-waves__canvas" />
  </div>
</template>

<style scoped>
  .shape-waves {
    overflow: hidden;
    pointer-events: none;
    isolation: isolate;
  }

  .shape-waves__canvas {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: none;
  }

  .shape-waves[data-ready='true'] .shape-waves__canvas {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .shape-waves__canvas {
      transition: none;
    }
  }
</style>
