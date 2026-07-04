<script setup lang="ts">
  // Vue wrapper for the Paper Shaders warp
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <Warp> defaultPreset.
  import { computed } from 'vue';
  import {
    warpFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
    WarpPatterns,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperWarpProps } from './types';

  const props = withDefaults(defineProps<PaperWarpProps>(), {
    colors: () => ['#121212', '#9470ff', '#121212', '#8838ff'],
    proportion: 0.45,
    softness: 1,
    distortion: 0.25,
    swirl: 0.8,
    swirlIterations: 10,
    shapeScale: 0.1,
    shape: 'checks',
    speed: 1,
    frame: 0,
    fit: 'none',
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
    u_colors: props.colors.map(getShaderColorFromString),
    u_colorsCount: props.colors.length,
    u_proportion: props.proportion,
    u_softness: props.softness,
    u_distortion: props.distortion,
    u_swirl: props.swirl,
    u_swirlIterations: props.swirlIterations,
    u_shapeScale: props.shapeScale,
    u_shape: WarpPatterns[props.shape],
    u_noiseTexture: getShaderNoiseTexture(),
    u_scale: props.scale,
    u_rotation: props.rotation,
    u_fit: ShaderFitOptions[props.fit],
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
    :fragment-shader="warpFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
