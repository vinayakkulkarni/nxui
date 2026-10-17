<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createGlowCursor } from './create-glow-cursor';
  import type {
    GlowCursorEngine,
    GlowCursorProps,
    GlowCursorSettings,
  } from './types';

  const props = withDefaults(defineProps<GlowCursorProps>(), {
    color: '#5f8bff',
    secondaryColor: '',
    intensity: 1.3,
    trailWidth: 3,
    linger: 1.4,
    glow: 1.2,
    hotspot: 0.8,
    followSpeed: 0.6,
    grain: 0,
    clickBurst: true,
    quality: 'high',
    theme: 'dark',
    blendMode: undefined,
    maxDevicePixelRatio: 2,
    enabled: true,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const canvasStyle = computed(() => ({
    mixBlendMode:
      props.blendMode ?? (props.theme === 'light' ? 'normal' : 'screen'),
  }));

  const settings = computed<GlowCursorSettings>(() => ({
    color: props.color,
    secondaryColor: props.secondaryColor,
    intensity: Math.max(0, props.intensity),
    trailWidth: Math.min(40, Math.max(0.5, props.trailWidth)),
    linger: Math.min(10, Math.max(0.1, props.linger)),
    glow: Math.max(0, props.glow),
    hotspot: Math.max(0, props.hotspot),
    followSpeed: Math.min(1, Math.max(0, props.followSpeed)),
    grain: Math.max(0, props.grain),
    clickBurst: props.clickBurst,
    quality: props.quality,
    theme: props.theme,
    maxDevicePixelRatio: props.maxDevicePixelRatio,
    enabled: props.enabled,
    reducedMotion: reducedMotion.value === 'reduce',
  }));

  let engine: GlowCursorEngine | null = null;

  function readSettings() {
    return settings.value;
  }

  onMounted(() => {
    if (!containerRef.value || !canvasRef.value) return;
    engine = createGlowCursor(
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
  <div ref="containerRef" :class="cn('glow-cursor', props.class)">
    <canvas
      ref="canvasRef"
      class="glow-cursor__canvas"
      :style="canvasStyle"
      aria-hidden="true"
    />
    <div v-if="$slots.default" class="glow-cursor__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .glow-cursor {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .glow-cursor__canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
  }

  .glow-cursor__content {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
  }
</style>
