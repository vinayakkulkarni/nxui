<script setup lang="ts">
  // Vue wrapper for the Paper Shaders metaballs
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <Metaballs> defaultPreset.
  import { computed } from 'vue';
  import {
    metaballsFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperMetaballsProps } from './types';

  const props = withDefaults(defineProps<PaperMetaballsProps>(), {
    colorBack: '#000000',
    colors: () => ['#6e33cc', '#ff5500', '#ffc105', '#ffc800', '#f585ff'],
    count: 10,
    size: 0.83,
    scale: 1,
    speed: 1,
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
    u_size: props.size,
    u_count: props.count,
    u_noiseTexture: getShaderNoiseTexture(),
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
    :fragment-shader="metaballsFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
