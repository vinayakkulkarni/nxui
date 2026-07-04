<script setup lang="ts">
  // Vue wrapper for the Paper Shaders god-rays
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <GodRays> defaultPreset.
  import { computed } from 'vue';
  import {
    godRaysFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperGodRaysProps } from './types';

  const props = withDefaults(defineProps<PaperGodRaysProps>(), {
    colorBloom: '#0000ff',
    colorBack: '#000000',
    colors: () => ['#a600ff6e', '#6200fff0', '#ffffff', '#33fff5'],
    density: 0.3,
    spotty: 0.3,
    midIntensity: 0.4,
    midSize: 0.2,
    intensity: 0.8,
    bloom: 0.4,
    speed: 0.75,
    frame: 0,
    fit: 'contain',
    scale: 1,
    rotation: 0,
    originX: 0.5,
    originY: 0.5,
    offsetX: 0,
    offsetY: -0.55,
    worldWidth: 0,
    worldHeight: 0,
    class: '',
  });

  const uniforms = computed(() => ({
    u_colorBloom: getShaderColorFromString(props.colorBloom),
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colors: props.colors.map(getShaderColorFromString),
    u_colorsCount: props.colors.length,
    u_density: props.density,
    u_spotty: props.spotty,
    u_midIntensity: props.midIntensity,
    u_midSize: props.midSize,
    u_intensity: props.intensity,
    u_bloom: props.bloom,
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
    :fragment-shader="godRaysFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
