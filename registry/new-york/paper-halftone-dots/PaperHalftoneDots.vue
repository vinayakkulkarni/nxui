<script setup lang="ts">
  // Vue wrapper for the Paper Shaders halftone-dots
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <HalftoneDots> defaultPreset.
  // The source image URL is passed through to u_image unchanged — PaperShaderMount
  // loads it into an HTMLImageElement on mount.
  import { computed } from 'vue';
  import {
    halftoneDotsFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
    HalftoneDotsTypes,
    HalftoneDotsGrids,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperHalftoneDotsProps } from './types';

  const props = withDefaults(defineProps<PaperHalftoneDotsProps>(), {
    speed: 0,
    frame: 0,
    colorFront: '#2b2b2b',
    colorBack: '#f2f1e8',
    image: '',
    size: 0.5,
    radius: 1.25,
    contrast: 0.4,
    originalColors: false,
    inverted: false,
    grainMixer: 0.2,
    grainOverlay: 0.2,
    grainSize: 0.5,
    grid: 'hex',
    type: 'gooey',
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
    u_colorFront: getShaderColorFromString(props.colorFront),
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_size: props.size,
    u_radius: props.radius,
    u_contrast: props.contrast,
    u_originalColors: props.originalColors,
    u_inverted: props.inverted,
    u_grainMixer: props.grainMixer,
    u_grainOverlay: props.grainOverlay,
    u_grainSize: props.grainSize,
    u_grid: HalftoneDotsGrids[props.grid],
    u_type: HalftoneDotsTypes[props.type],
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
    :fragment-shader="halftoneDotsFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
