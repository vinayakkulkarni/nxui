<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredDark,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { createParticleTextEngine } from './particle-text-engine';
  import type { ParticleTextEngine, ParticleTextProps } from './types';

  const props = withDefaults(defineProps<ParticleTextProps>(), {
    text: 'nxui',
    particleSize: 2,
    density: 4,
    color: 'currentColor',
    highlightColor: '#ff5a36',
    highlightMode: 'motion',
    shape: 'circle',
    intro: 'gather',
    scatter: 180,
    gatherDuration: 1600,
    stagger: 420,
    clickBurst: true,
    burstStrength: 1,
    pointerRepel: 40,
    repelRadius: 120,
    idleDrift: 0.7,
    trigger: 'mount',
    fontSize: 'clamp(3rem, 12vw, 8rem)',
    fontWeight: 800,
    fontFamily: 'inherit',
    glow: true,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const engine = shallowRef<ParticleTextEngine | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const prefersDark = usePreferredDark();
  let themeObserver: MutationObserver | null = null;

  function getSettings() {
    return props;
  }

  function wake() {
    engine.value?.wake();
  }

  function onPointerEnter(event: PointerEvent) {
    engine.value?.pointerEnter(event);
  }

  function onPointerMove(event: PointerEvent) {
    engine.value?.pointerMove(event);
  }

  function onPointerLeave() {
    engine.value?.pointerLeave();
  }

  function onPointerDown(event: PointerEvent) {
    engine.value?.pointerDown(event);
  }

  function onClick() {
    engine.value?.click();
  }

  useEventListener(canvasRef, 'pointerenter', onPointerEnter);
  useEventListener(canvasRef, 'pointermove', onPointerMove);
  useEventListener(canvasRef, 'pointerleave', onPointerLeave);
  useEventListener(canvasRef, 'pointerdown', onPointerDown);
  useEventListener(canvasRef, 'click', onClick);

  useResizeObserver(containerRef, () => engine.value?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (entry) engine.value?.setVisible(entry.isIntersecting);
  });

  watch(props, wake);
  watch(prefersDark, wake);
  watch(reducedMotion, (value) => {
    engine.value?.setReducedMotion(value === 'reduce');
  });

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine.value = createParticleTextEngine(
      container,
      canvas,
      getSettings,
      reducedMotion.value === 'reduce',
    );
    themeObserver = new MutationObserver(wake);
    for (const node of [document.documentElement, document.body]) {
      themeObserver.observe(node, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme'],
      });
    }
  });

  onBeforeUnmount(() => {
    themeObserver?.disconnect();
    themeObserver = null;
    engine.value?.destroy();
    engine.value = null;
  });
</script>

<template>
  <div ref="containerRef" :class="['particle-text', props.class]">
    <canvas ref="canvasRef" class="particle-text__canvas" aria-hidden="true" />
    <span class="particle-text__sr">{{ text }}</span>
  </div>
</template>

<style scoped>
  .particle-text {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    min-height: 240px;
    overflow: hidden;
    touch-action: pan-y;
    isolation: isolate;
  }

  .particle-text__canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .particle-text__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
