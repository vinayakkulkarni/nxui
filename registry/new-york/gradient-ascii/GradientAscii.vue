<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    DEFAULT_CHARACTERS,
    DEFAULT_COLORS,
    DEFAULT_FONT,
    createGradientAscii,
    toSettings,
  } from './gradient-ascii';
  import type {
    GradientAsciiEngine,
    GradientAsciiProps,
    GradientAsciiSettings,
  } from './types';

  const props = withDefaults(defineProps<GradientAsciiProps>(), {
    colors: () => [...DEFAULT_COLORS],
    shape: 'horizon',
    characters: DEFAULT_CHARACTERS,
    cellSize: 18,
    density: 0.8,
    glyphOpacity: 0.85,
    glow: 0.2,
    depthOfField: 0,
    flicker: 0.2,
    softness: 0.5,
    scale: 1,
    flow: 0.5,
    speed: 1,
    gradientOpacity: 0.9,
    grain: 0.08,
    variation: 0,
    mouseInteraction: true,
    scrambleRadius: 0.1,
    clickEffect: 'wave',
    intro: true,
    lightMode: false,
    fontFamily: DEFAULT_FONT,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const settings = computed<GradientAsciiSettings>(() =>
    toSettings({
      colors: props.colors,
      shape: props.shape,
      characters: props.characters,
      cellSize: props.cellSize,
      density: props.density,
      glyphOpacity: props.glyphOpacity,
      glow: props.glow,
      depthOfField: props.depthOfField,
      flicker: props.flicker,
      softness: props.softness,
      scale: props.scale,
      flow: props.flow,
      speed: props.speed,
      gradientOpacity: props.gradientOpacity,
      grain: props.grain,
      variation: props.variation,
      mouseInteraction: props.mouseInteraction,
      scrambleRadius: props.scrambleRadius,
      clickEffect: props.clickEffect,
      intro: props.intro,
      lightMode: props.lightMode,
      fontFamily: props.fontFamily,
      dpr: props.dpr,
    }),
  );

  let engine: GradientAsciiEngine | null = null;

  function readSettings(): GradientAsciiSettings {
    return settings.value;
  }

  onMounted(() => {
    if (!containerRef.value || !canvasRef.value) return;
    engine = createGradientAscii(
      containerRef.value,
      canvasRef.value,
      readSettings,
    );
  });

  watch(settings, () => engine?.wake());

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div ref="containerRef" :class="['gradient-ascii-container', props.class]">
    <canvas ref="canvasRef" class="gradient-ascii-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .gradient-ascii-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .gradient-ascii-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
