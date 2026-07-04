<script setup lang="ts">
  // Vue wrapper for the Paper Shaders simplex-noise
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <SimplexNoise> defaultPreset.
  import { computed } from 'vue';
  import {
    simplexNoiseFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperSimplexNoiseProps } from './types';

  const props = withDefaults(defineProps<PaperSimplexNoiseProps>(), {
    colors: () => ['#4449CF', '#FFD1E0', '#F94446', '#FFD36B', '#FFFFFF'],
    stepsPerColor: 2,
    softness: 0,
    scale: 0.6,
    speed: 0.5,
    frame: 0,
    fit: 'none',
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
    u_softness: props.softness,
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
    :fragment-shader="simplexNoiseFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
