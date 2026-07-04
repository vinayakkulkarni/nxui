<script setup lang="ts">
  // Vue wrapper for the Paper Shaders neuro-noise
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <NeuroNoise> defaultPreset.
  import { computed } from 'vue';
  import {
    neuroNoiseFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperNeuroNoiseProps } from './types';

  const props = withDefaults(defineProps<PaperNeuroNoiseProps>(), {
    colorFront: '#ffffff',
    colorMid: '#47a6ff',
    colorBack: '#000000',
    brightness: 0.05,
    contrast: 0.3,
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
    u_colorFront: getShaderColorFromString(props.colorFront),
    u_colorMid: getShaderColorFromString(props.colorMid),
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_brightness: props.brightness,
    u_contrast: props.contrast,
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
    :fragment-shader="neuroNoiseFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
