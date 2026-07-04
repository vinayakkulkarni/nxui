<script setup lang="ts">
  // Vue wrapper for the Paper Shaders dot-orbit
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <DotOrbit> defaultPreset.
  import { computed } from 'vue';
  import {
    dotOrbitFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperDotOrbitProps } from './types';

  const props = withDefaults(defineProps<PaperDotOrbitProps>(), {
    colorBack: '#000000',
    colors: () => ['#ffc96b', '#ff6200', '#ff2f00', '#421100', '#1a0000'],
    size: 1,
    sizeRange: 0,
    spreading: 1,
    stepsPerColor: 4,
    speed: 1.5,
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
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colors: props.colors.map(getShaderColorFromString),
    u_colorsCount: props.colors.length,
    u_size: props.size,
    u_sizeRange: props.sizeRange,
    u_spreading: props.spreading,
    u_stepsPerColor: props.stepsPerColor,
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
    :fragment-shader="dotOrbitFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
