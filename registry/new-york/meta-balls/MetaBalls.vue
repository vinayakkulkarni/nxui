<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createMetaBalls } from './meta-balls-engine';
  import type {
    MetaBallsEngine,
    MetaBallsProps,
    MetaBallsSettings,
  } from './types';

  const props = withDefaults(defineProps<MetaBallsProps>(), {
    color: '#ffffff',
    cursorBallColor: '#ffffff',
    speed: 0.3,
    enableMouseInteraction: true,
    hoverSmoothness: 0.1,
    animationSize: 30,
    ballCount: 15,
    clumpFactor: 1,
    cursorBallSize: 3,
    enableTransparency: false,
    variant: 'solid',
    motion: 'orbit',
    gooeyness: 0.5,
    stickiness: 0.5,
    stretch: 0.5,
    wobble: 0.5,
    lineWidth: 1.5,
    rings: 4,
    clickBurst: true,
    intro: true,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const settings = computed<MetaBallsSettings>(() => ({
    color: props.color,
    cursorBallColor: props.cursorBallColor,
    speed: props.speed,
    enableMouseInteraction: props.enableMouseInteraction,
    hoverSmoothness: props.hoverSmoothness,
    animationSize: props.animationSize,
    ballCount: props.ballCount,
    clumpFactor: props.clumpFactor,
    cursorBallSize: props.cursorBallSize,
    enableTransparency: props.enableTransparency,
    variant: props.variant,
    motion: props.motion,
    gooeyness: props.gooeyness,
    stickiness: props.stickiness,
    stretch: props.stretch,
    wobble: props.wobble,
    lineWidth: props.lineWidth,
    rings: props.rings,
    clickBurst: props.clickBurst,
    paused: props.paused,
    dpr: props.dpr,
  }));

  let engine: MetaBallsEngine | null = null;
  const getSettings = () => settings.value;

  onMounted(() => {
    if (!containerRef.value || !canvasRef.value) return;
    engine = createMetaBalls(
      containerRef.value,
      canvasRef.value,
      getSettings,
      props.intro,
    );
  });

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });

  watch(settings, () => engine?.refresh());
  watch(
    () => props.dpr,
    () => engine?.resize(),
  );

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  const passive = { passive: true };

  function onMove(event: PointerEvent) {
    engine?.move(event.clientX, event.clientY);
  }

  function onDown(event: PointerEvent) {
    if (event.button !== 0) return;
    engine?.press(event.clientX, event.clientY);
  }

  function onOut(event: PointerEvent) {
    if (!event.relatedTarget) engine?.leave();
  }

  function onLift(event: PointerEvent) {
    if (event.pointerType !== 'mouse') engine?.leave();
  }

  useEventListener('pointermove', onMove, passive);
  useEventListener('pointerdown', onDown, passive);
  useEventListener('pointerout', onOut);
  useEventListener('pointerup', onLift);
  useEventListener('pointercancel', onLift);
</script>

<template>
  <div ref="containerRef" :class="cn('metaballs-container', props.class)">
    <canvas ref="canvasRef" class="metaballs-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .metaballs-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .metaballs-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
