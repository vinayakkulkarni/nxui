<script setup lang="ts">
  // Vue wrapper for the Paper Shaders spiral
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <Spiral> defaultPreset.
  import { computed } from 'vue';
  import {
    spiralFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperSpiralProps } from './types';

  const props = withDefaults(defineProps<PaperSpiralProps>(), {
    colorBack: '#001429',
    colorFront: '#79D1FF',
    density: 1,
    distortion: 0,
    strokeWidth: 0.5,
    strokeTaper: 0,
    strokeCap: 0,
    noise: 0,
    noiseFrequency: 0,
    softness: 0,
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
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colorFront: getShaderColorFromString(props.colorFront),
    u_density: props.density,
    u_distortion: props.distortion,
    u_strokeWidth: props.strokeWidth,
    u_strokeTaper: props.strokeTaper,
    u_strokeCap: props.strokeCap,
    u_noiseFrequency: props.noiseFrequency,
    u_noise: props.noise,
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
    :fragment-shader="spiralFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
