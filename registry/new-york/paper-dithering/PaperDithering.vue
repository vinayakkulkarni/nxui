<script setup lang="ts">
  // Vue wrapper for the Paper Shaders dithering
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <Dithering> defaultPreset.
  import { computed } from 'vue';
  import {
    ditheringFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
    DitheringShapes,
    DitheringTypes,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperDitheringProps } from './types';

  const props = withDefaults(defineProps<PaperDitheringProps>(), {
    colorBack: '#000000',
    colorFront: '#00b2ff',
    shape: 'sphere',
    type: '4x4',
    size: 2,
    speed: 1,
    frame: 0,
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
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colorFront: getShaderColorFromString(props.colorFront),
    u_shape: DitheringShapes[props.shape],
    u_type: DitheringTypes[props.type],
    u_pxSize: props.size,
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
    :fragment-shader="ditheringFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
