<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { BOLT } from './electric-logo-math';
  import { createElectricLogoEngine } from './electric-logo-engine';
  import type { ElectricLogoProps, ElectricLogoSettings } from './types';

  const props = withDefaults(defineProps<ElectricLogoProps>(), {
    src: undefined,
    color: '#ecc7ff',
    glowColor: '#ad6dff',
    scale: 0.7,
    intensity: 1,
    glow: 1,
    thickness: 1.5,
    strands: 4,
    bend: 0.6,
    crackle: 1.5,
    arcs: 1,
    flicker: 0.6,
    fill: 0,
    speed: 2.5,
    interactive: true,
    cursorIntensity: 0.75,
    cursorRadius: 100,
    theme: 'dark',
    onRender: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<ElectricLogoSettings>(() => ({
    src: props.src || BOLT,
    color: props.color,
    glowColor: props.glowColor,
    scale: props.scale,
    intensity: props.intensity,
    glow: props.glow,
    thickness: props.thickness,
    strands: props.strands,
    bend: props.bend,
    crackle: props.crackle,
    arcs: props.arcs,
    flicker: props.flicker,
    fill: props.fill,
    speed: props.speed,
    interactive: props.interactive,
    cursorIntensity: props.cursorIntensity,
    cursorRadius: props.cursorRadius,
    theme: props.theme,
    onRender: props.onRender,
  }));

  let engine: ReturnType<typeof createElectricLogoEngine> = null;

  function readSettings(): ElectricLogoSettings {
    return settings.value;
  }

  function isReducedMotion(): boolean {
    return reducedMotion.value === 'reduce';
  }

  onMounted(() => {
    if (!containerRef.value) return;
    engine = createElectricLogoEngine(
      containerRef.value,
      readSettings,
      isReducedMotion,
    );
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  />
</template>
