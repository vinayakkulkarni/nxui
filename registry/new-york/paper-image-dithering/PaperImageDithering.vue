<script setup lang="ts">
  // Vue wrapper for the Paper Shaders image-dithering
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <ImageDithering> defaultPreset.
  import { computed } from 'vue';
  import {
    imageDitheringFragmentShader,
    getShaderColorFromString,
    DitheringTypes,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperImageDitheringProps } from './types';

  const props = withDefaults(defineProps<PaperImageDitheringProps>(), {
    image: '',
    colorFront: '#94ffaf',
    colorBack: '#000c38',
    colorHighlight: '#eaff94',
    type: '8x8',
    size: 2,
    colorSteps: 2,
    originalColors: false,
    inverted: false,
    speed: 0,
    frame: 0,
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
    u_colorHighlight: getShaderColorFromString(props.colorHighlight),
    u_type: DitheringTypes[props.type],
    u_pxSize: props.size,
    u_colorSteps: props.colorSteps,
    u_originalColors: props.originalColors,
    u_inverted: props.inverted,
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
    :fragment-shader="imageDitheringFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
