<script setup lang="ts">
  // Vue wrapper for the Paper Shaders swirl
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <Swirl> defaultPreset.
  import { computed } from 'vue';
  import {
    swirlFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperSwirlProps } from './types';

  const props = withDefaults(defineProps<PaperSwirlProps>(), {
    colorBack: '#330000',
    colors: () => ['#ffd1d1', '#ff8a8a', '#660000'],
    bandCount: 4,
    twist: 0.1,
    center: 0.2,
    proportion: 0.5,
    softness: 0,
    noiseFrequency: 0.4,
    noise: 0.2,
    speed: 0.32,
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
    u_bandCount: props.bandCount,
    u_twist: props.twist,
    u_center: props.center,
    u_proportion: props.proportion,
    u_softness: props.softness,
    u_noiseFrequency: props.noiseFrequency,
    u_noise: props.noise,
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
    :fragment-shader="swirlFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
