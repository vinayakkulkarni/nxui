<script setup lang="ts">
  // Vue wrapper for the Paper Shaders static-radial-gradient
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <StaticRadialGradient> defaultPreset.
  import { computed } from 'vue';
  import {
    staticRadialGradientFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperStaticRadialGradientProps } from './types';

  const props = withDefaults(defineProps<PaperStaticRadialGradientProps>(), {
    colorBack: '#000000',
    colors: () => ['#00bbff', '#00ffe1', '#ffffff'],
    radius: 0.8,
    focalDistance: 0.99,
    focalAngle: 0,
    falloff: 0.24,
    mixing: 0.5,
    distortion: 0,
    distortionShift: 0,
    distortionFreq: 12,
    grainMixer: 0,
    grainOverlay: 0,
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
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colors: props.colors.map(getShaderColorFromString),
    u_colorsCount: props.colors.length,
    u_radius: props.radius,
    u_focalDistance: props.focalDistance,
    u_focalAngle: props.focalAngle,
    u_falloff: props.falloff,
    u_mixing: props.mixing,
    u_distortion: props.distortion,
    u_distortionShift: props.distortionShift,
    u_distortionFreq: props.distortionFreq,
    u_grainMixer: props.grainMixer,
    u_grainOverlay: props.grainOverlay,
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
    :fragment-shader="staticRadialGradientFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
