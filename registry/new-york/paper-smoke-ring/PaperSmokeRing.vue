<script setup lang="ts">
  // Vue wrapper for the Paper Shaders smoke-ring
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <SmokeRing> defaultPreset.
  import { computed } from 'vue';
  import {
    smokeRingFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperSmokeRingProps } from './types';

  const props = withDefaults(defineProps<PaperSmokeRingProps>(), {
    colorBack: '#000000',
    colors: () => ['#ffffff'],
    noiseScale: 3,
    noiseIterations: 8,
    radius: 0.25,
    thickness: 0.65,
    innerShape: 0.7,
    scale: 0.8,
    speed: 0.5,
    frame: 0,
    fit: 'contain',
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
    u_noiseScale: props.noiseScale,
    u_thickness: props.thickness,
    u_radius: props.radius,
    u_innerShape: props.innerShape,
    u_noiseIterations: props.noiseIterations,
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
    :fragment-shader="smokeRingFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
