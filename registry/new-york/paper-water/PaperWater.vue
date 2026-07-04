<script setup lang="ts">
  // Vue wrapper for the Paper Shaders water
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <Water> defaultPreset.
  import { computed } from 'vue';
  import {
    waterFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperWaterProps } from './types';

  const props = withDefaults(defineProps<PaperWaterProps>(), {
    image: '',
    colorBack: '#909090',
    colorHighlight: '#ffffff',
    highlights: 0.07,
    layering: 0.5,
    edges: 0.8,
    waves: 0.3,
    caustic: 0.1,
    size: 1,
    speed: 1,
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
    u_image: props.image,
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colorHighlight: getShaderColorFromString(props.colorHighlight),
    u_highlights: props.highlights,
    u_layering: props.layering,
    u_waves: props.waves,
    u_edges: props.edges,
    u_caustic: props.caustic,
    u_size: props.size,
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
    :fragment-shader="waterFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :mipmaps="['u_image']"
    :class="props.class"
  />
</template>
