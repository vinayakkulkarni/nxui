<script setup lang="ts">
  // Vue wrapper for the Paper Shaders voronoi
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <Voronoi> defaultPreset.
  import { computed } from 'vue';
  import {
    voronoiFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperVoronoiProps } from './types';

  const props = withDefaults(defineProps<PaperVoronoiProps>(), {
    colors: () => ['#ff8247', '#ffe53d'],
    stepsPerColor: 3,
    colorGlow: '#ffffff',
    colorGap: '#2e0000',
    distortion: 0.4,
    gap: 0.04,
    glow: 0,
    speed: 0.5,
    frame: 0,
    fit: 'none',
    scale: 0.5,
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
    u_stepsPerColor: props.stepsPerColor,
    u_colorGlow: getShaderColorFromString(props.colorGlow),
    u_colorGap: getShaderColorFromString(props.colorGap),
    u_distortion: props.distortion,
    u_gap: props.gap,
    u_glow: props.glow,
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
    :fragment-shader="voronoiFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
