<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { createShapeBlurRenderer } from './shape-blur-renderer';
  import type {
    ShapeBlurProps,
    ShapeBlurRenderer,
    ShapeBlurSettings,
  } from './types';

  const props = withDefaults(defineProps<ShapeBlurProps>(), {
    shape: 'rect',
    src: undefined,
    sides: 6,
    size: 0.8,
    roundness: 0.2,
    thickness: 2,
    fill: false,
    echoes: 1,
    spacing: 12,
    color: '#ffffff',
    blur: 16,
    lensSize: 0.3,
    lensSoftness: 0.7,
    focus: false,
    chroma: 0.3,
    rotation: 0,
    spin: 0,
    idle: true,
    class: '',
  });

  const SHAPES = ['rect', 'circle', 'polygon', 'star'];

  const rootRef = useTemplateRef<HTMLDivElement>('root');
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const reducedMotion = usePreferredReducedMotion();
  let renderer: ShapeBlurRenderer | null = null;

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  const settings = computed<ShapeBlurSettings>(() => ({
    shape: Math.max(0, SHAPES.indexOf(props.shape)),
    src: props.src || '',
    sides: clamp(Math.round(props.sides), 3, 12),
    size: clamp(props.size, 0.05, 1),
    roundness: clamp(props.roundness, 0, 1),
    thickness: clamp(props.thickness, 0.5, 40),
    fill: props.fill,
    echoes: clamp(Math.round(props.echoes), 1, 24),
    spacing: Math.max(1, props.spacing),
    color: props.color,
    blur: Math.max(0, props.blur),
    lensSize: clamp(props.lensSize, 0.02, 2),
    lensSoftness: clamp(props.lensSoftness, 0, 1),
    focus: props.focus,
    chroma: clamp(props.chroma, 0, 1),
    rotation: props.rotation,
    spin: props.spin,
    idle: props.idle,
  }));

  onMounted(() => {
    const root = rootRef.value;
    const canvas = canvasRef.value;
    if (!root || !canvas) return;
    renderer = createShapeBlurRenderer(
      root,
      canvas,
      () => settings.value,
      reducedMotion.value === 'reduce',
    );
    renderer?.load(props.src || '');
  });

  onBeforeUnmount(() => {
    renderer?.destroy();
    renderer = null;
  });

  watch(
    () => props.src,
    (value) => renderer?.load(value || ''),
  );
  watch(settings, () => renderer?.wake());
  watch(reducedMotion, (value) => renderer?.setReduced(value === 'reduce'));

  useResizeObserver(rootRef, () => renderer?.resize());
  useIntersectionObserver(rootRef, (entries) => {
    renderer?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener(
    () => rootRef.value?.ownerDocument.documentElement,
    'pointerleave',
    onPointerLeave,
  );

  function onPointerMove(event: PointerEvent) {
    renderer?.onPointerMove(event);
  }

  function onPointerLeave() {
    renderer?.onPointerLeave();
  }
</script>

<template>
  <div ref="root" :class="['shape-blur', props.class]">
    <canvas ref="canvas" class="shape-blur__canvas" aria-hidden="true"></canvas>
    <div v-if="$slots.default" class="shape-blur__content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .shape-blur {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .shape-blur__canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .shape-blur__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
</style>
