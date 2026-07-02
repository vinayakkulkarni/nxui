<script setup lang="ts">
  // Vue wrapper for the Paper Shaders color-panels
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <ColorPanels> defaultPreset.
  import { computed } from 'vue';
  import {
    colorPanelsFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperColorPanelsProps } from './types';

  const props = withDefaults(defineProps<PaperColorPanelsProps>(), {
    colors: () => [
      '#ff9d00',
      '#fd4f30',
      '#809bff',
      '#6d2eff',
      '#333aff',
      '#f15cff',
      '#ffd557',
    ],
    colorBack: '#000000',
    angle1: 0,
    angle2: 0,
    length: 1.1,
    edges: false,
    blur: 0,
    fadeIn: 1,
    fadeOut: 0.3,
    gradient: 0,
    density: 3,
    speed: 0.5,
    frame: 0,
    fit: 'contain',
    scale: 0.8,
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
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_angle1: props.angle1,
    u_angle2: props.angle2,
    u_length: props.length,
    u_edges: props.edges,
    u_blur: props.blur,
    u_fadeIn: props.fadeIn,
    u_fadeOut: props.fadeOut,
    u_density: props.density,
    u_gradient: props.gradient,
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
    :fragment-shader="colorPanelsFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
