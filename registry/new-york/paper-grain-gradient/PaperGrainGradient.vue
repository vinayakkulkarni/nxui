<script setup lang="ts">
  // Vue wrapper for the Paper Shaders grain-gradient
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <GrainGradient> defaultPreset.
  import { computed } from 'vue';
  import {
    grainGradientFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
    GrainGradientShapes,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperGrainGradientProps } from './types';

  const props = withDefaults(defineProps<PaperGrainGradientProps>(), {
    colorBack: '#000000',
    colors: () => ['#7300ff', '#eba8ff', '#00bfff', '#2a00ff'],
    softness: 0.5,
    intensity: 0.5,
    noise: 0.25,
    shape: 'corners',
    speed: 1,
    frame: 0,
    fit: 'contain',
    scale: 1,
    rotation: 0,
    originX: 0.5,
    originY: 0.5,
    offsetX: 0,
    offsetY: 0,
    worldWidth: 0,
    worldHeight: 0,
    class: '',
  });

  const uniforms = computed(() => ({
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colors: props.colors.map(getShaderColorFromString),
    u_colorsCount: props.colors.length,
    u_softness: props.softness,
    u_intensity: props.intensity,
    u_noise: props.noise,
    u_shape: GrainGradientShapes[props.shape],
    u_noiseTexture: getShaderNoiseTexture(),
    u_fit: ShaderFitOptions[props.fit],
    u_scale: props.scale,
    u_rotation: props.rotation,
    u_offsetX: props.offsetX,
    u_offsetY: props.offsetY,
    u_originX: props.originX,
    u_originY: props.originY,
    u_worldWidth: props.worldWidth,
    u_worldHeight: props.worldHeight,
  }));
</script>

<template>
  <PaperShaderMount
    :fragment-shader="grainGradientFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
