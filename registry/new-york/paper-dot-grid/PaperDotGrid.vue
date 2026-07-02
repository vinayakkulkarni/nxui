<script setup lang="ts">
  // Vue wrapper for the Paper Shaders dot-grid
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <DotGrid> defaultPreset.
  import { computed } from 'vue';
  import {
    dotGridFragmentShader,
    DotGridShapes,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperDotGridProps } from './types';

  const props = withDefaults(defineProps<PaperDotGridProps>(), {
    colorBack: '#000000',
    colorFill: '#ffffff',
    colorStroke: '#ffaa00',
    size: 2,
    gapX: 32,
    gapY: 32,
    strokeWidth: 0,
    sizeRange: 0,
    opacityRange: 0,
    shape: 'circle',
    speed: 0,
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
    u_colorFill: getShaderColorFromString(props.colorFill),
    u_colorStroke: getShaderColorFromString(props.colorStroke),
    u_dotSize: props.size,
    u_gapX: props.gapX,
    u_gapY: props.gapY,
    u_strokeWidth: props.strokeWidth,
    u_sizeRange: props.sizeRange,
    u_opacityRange: props.opacityRange,
    u_shape: DotGridShapes[props.shape],
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
    :fragment-shader="dotGridFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
