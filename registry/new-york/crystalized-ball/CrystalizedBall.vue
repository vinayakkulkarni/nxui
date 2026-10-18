<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { buildPalette, parseColor } from './ball-math';
  import { createCrystalizedBall } from './create-crystalized-ball';
  import { BALL_PRESETS } from './presets';
  import type {
    CrystalizedBallEngine,
    CrystalizedBallProps,
    CrystalizedBallSettings,
  } from './types';

  const props = withDefaults(defineProps<CrystalizedBallProps>(), {
    preset: 'plasma',
    color: undefined,
    theme: 'dark',
    size: 0.7,
    strands: undefined,
    crackle: undefined,
    flares: undefined,
    glow: undefined,
    sparks: undefined,
    particleCount: undefined,
    fill: undefined,
    motion: undefined,
    particleShape: undefined,
    depth: undefined,
    sway: undefined,
    twinkle: undefined,
    haze: undefined,
    speed: 1,
    dustSpeed: undefined,
    interactive: true,
    hoverStrength: 0.7,
    intro: true,
    paused: false,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const base = computed(
    () => BALL_PRESETS[props.preset] ?? BALL_PRESETS.plasma,
  );
  const tint = computed(() => props.color ?? base.value.color);
  const light = computed(() => props.theme === 'light');
  const palette = computed(() =>
    buildPalette(parseColor(tint.value, [0.95, 0.36, 0.82]), light.value),
  );

  const settings = computed<CrystalizedBallSettings>(() => {
    const b = base.value;
    return {
      light: light.value,
      palette: palette.value,
      size: props.size,
      strands: props.strands ?? b.strands,
      crackle: props.crackle ?? b.crackle,
      flares: props.flares ?? b.flares,
      glow: props.glow ?? b.glow,
      sparks: props.sparks ?? b.sparks,
      particleCount: props.particleCount ?? b.particleCount,
      fill: props.fill ?? b.fill,
      motion: props.motion ?? b.motion,
      particleShape: props.particleShape ?? b.particleShape,
      depth: props.depth ?? b.depth,
      sway: props.sway ?? b.sway,
      twinkle: props.twinkle ?? b.twinkle,
      haze: props.haze ?? b.haze,
      dustSpeed: props.dustSpeed ?? b.dustSpeed,
      speed: props.speed,
      interactive: props.interactive,
      hoverStrength: props.hoverStrength,
      intro: props.intro,
      paused: props.paused,
      reducedMotion: reducedMotion.value === 'reduce',
    };
  });

  let engine: CrystalizedBallEngine | null = null;

  onMounted(() => {
    if (!containerRef.value) return;
    engine = createCrystalizedBall(containerRef.value, () => settings.value);
  });

  watch(settings, () => engine?.wake());

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div ref="containerRef" :class="['crystalized-ball', props.class]" />
</template>

<style scoped>
  .crystalized-ball {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
