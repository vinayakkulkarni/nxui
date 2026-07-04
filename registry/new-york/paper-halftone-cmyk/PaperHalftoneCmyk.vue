<script setup lang="ts">
  // Vue wrapper for the Paper Shaders halftone-cmyk
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <HalftoneCmyk> defaultPreset.
  // The source image URL is passed through to u_image unchanged; the
  // u_noiseTexture is sourced from getShaderNoiseTexture() (an HTMLImageElement).
  import { computed } from 'vue';
  import {
    halftoneCmykFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
    HalftoneCmykTypes,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperHalftoneCmykProps } from './types';

  const props = withDefaults(defineProps<PaperHalftoneCmykProps>(), {
    speed: 0,
    frame: 0,
    colorBack: '#fbfaf5',
    colorC: '#00b4ff',
    colorM: '#fc519f',
    colorY: '#ffd800',
    colorK: '#231f20',
    image: '',
    size: 0.2,
    contrast: 1,
    softness: 1,
    grainSize: 0.5,
    grainMixer: 0,
    grainOverlay: 0,
    gridNoise: 0.2,
    floodC: 0.15,
    floodM: 0,
    floodY: 0,
    floodK: 0,
    gainC: 0.3,
    gainM: 0,
    gainY: 0.2,
    gainK: 0,
    type: 'ink',
    fit: 'cover',
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
    u_image: props.image,
    u_noiseTexture: getShaderNoiseTexture(),
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colorC: getShaderColorFromString(props.colorC),
    u_colorM: getShaderColorFromString(props.colorM),
    u_colorY: getShaderColorFromString(props.colorY),
    u_colorK: getShaderColorFromString(props.colorK),
    u_size: props.size,
    u_contrast: props.contrast,
    u_softness: props.softness,
    u_grainSize: props.grainSize,
    u_grainMixer: props.grainMixer,
    u_grainOverlay: props.grainOverlay,
    u_gridNoise: props.gridNoise,
    u_floodC: props.floodC,
    u_floodM: props.floodM,
    u_floodY: props.floodY,
    u_floodK: props.floodK,
    u_gainC: props.gainC,
    u_gainM: props.gainM,
    u_gainY: props.gainY,
    u_gainK: props.gainK,
    u_type: HalftoneCmykTypes[props.type],
    u_fit: ShaderFitOptions[props.fit],
    u_rotation: props.rotation,
    u_scale: props.scale,
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
    :fragment-shader="halftoneCmykFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
