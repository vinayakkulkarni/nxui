<script setup lang="ts">
  // Vue wrapper for the Paper Shaders lens-distortion
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <LensDistortion> defaultPreset.
  import { computed } from 'vue';
  import {
    lensDistortionFragmentShader,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperLensDistortionProps } from './types';

  const props = withDefaults(defineProps<PaperLensDistortionProps>(), {
    image: '',
    spread: 0.6,
    bias: 1,
    angle: 0,
    perspective: 0.1,
    count: 35,
    dispersion: 1,
    dispersionShift: 0,
    dispersionColor: 0.6,
    focusCenter: 0.8,
    focusEdges: 1,
    swirl: 0.35,
    noise: 0,
    noiseFrequency: 0.25,
    noiseOffset: 0,
    lensBulge: 0,
    lensCircle: 0,
    grainMixer: 0,
    grainOverlay: 0,
    imageX: 0,
    imageY: 0,
    speed: 0,
    frame: 0,
    fit: 'contain',
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
    u_spread: props.spread,
    u_bias: props.bias,
    u_angle: props.angle,
    u_perspective: props.perspective,
    u_count: props.count,
    u_dispersion: props.dispersion,
    u_dispersionShift: props.dispersionShift,
    u_dispersionColor: props.dispersionColor,
    u_focusCenter: props.focusCenter,
    u_focusEdges: props.focusEdges,
    u_swirl: props.swirl,
    u_noise: props.noise,
    u_noiseFrequency: props.noiseFrequency,
    u_noiseOffset: props.noiseOffset,
    u_lensBulge: props.lensBulge,
    u_lensCircle: props.lensCircle,
    u_grainMixer: props.grainMixer,
    u_grainOverlay: props.grainOverlay,
    u_imageX: props.imageX,
    u_imageY: props.imageY,
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
    :fragment-shader="lensDistortionFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :mipmaps="['u_image']"
    :class="props.class"
  />
</template>
