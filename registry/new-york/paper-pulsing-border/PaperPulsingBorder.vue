<script setup lang="ts">
  // Vue wrapper for the Paper Shaders pulsing-border
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <PulsingBorder> defaultPreset.
  import { computed } from 'vue';
  import {
    pulsingBorderFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
    PulsingBorderAspectRatios,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperPulsingBorderProps } from './types';

  const props = withDefaults(defineProps<PaperPulsingBorderProps>(), {
    colorBack: '#000000',
    colors: () => ['#0dc1fd', '#d915ef', '#ff3f2ecc'],
    roundness: 0.25,
    thickness: 0.1,
    margin: undefined,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    aspectRatio: 'auto',
    softness: 0.75,
    intensity: 0.2,
    bloom: 0.25,
    spots: 5,
    spotSize: 0.5,
    pulse: 0.25,
    smoke: 0.3,
    smokeSize: 0.6,
    speed: 1,
    frame: 0,
    fit: 'contain',
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
    u_colors: props.colors.map(getShaderColorFromString),
    u_colorsCount: props.colors.length,
    u_roundness: props.roundness,
    u_thickness: props.thickness,
    u_marginLeft: props.margin ?? props.marginLeft,
    u_marginRight: props.margin ?? props.marginRight,
    u_marginTop: props.margin ?? props.marginTop,
    u_marginBottom: props.margin ?? props.marginBottom,
    u_aspectRatio: PulsingBorderAspectRatios[props.aspectRatio],
    u_softness: props.softness,
    u_intensity: props.intensity,
    u_bloom: props.bloom,
    u_spots: props.spots,
    u_spotSize: props.spotSize,
    u_pulse: props.pulse,
    u_smoke: props.smoke,
    u_smokeSize: props.smokeSize,
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
    :fragment-shader="pulsingBorderFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
