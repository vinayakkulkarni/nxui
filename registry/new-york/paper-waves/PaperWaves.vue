<script setup lang="ts">
  // Vue wrapper for the Paper Shaders waves
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <Waves> defaultPreset.
  import { computed } from 'vue';
  import {
    wavesFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperWavesProps } from './types';

  const props = withDefaults(defineProps<PaperWavesProps>(), {
    colorFront: '#ffbb00',
    colorBack: '#000000',
    shape: 0,
    frequency: 0.5,
    amplitude: 0.5,
    spacing: 1.2,
    proportion: 0.1,
    softness: 0,
    fit: 'none',
    scale: 0.6,
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
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_shape: props.shape,
    u_frequency: props.frequency,
    u_amplitude: props.amplitude,
    u_spacing: props.spacing,
    u_proportion: props.proportion,
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
    :fragment-shader="wavesFragmentShader"
    :uniforms="uniforms"
    :class="props.class"
  />
</template>
