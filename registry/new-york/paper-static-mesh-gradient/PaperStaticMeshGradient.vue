<script setup lang="ts">
  // Vue wrapper for the Paper Shaders static-mesh-gradient
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <StaticMeshGradient> defaultPreset.
  import { computed } from 'vue';
  import {
    staticMeshGradientFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperStaticMeshGradientProps } from './types';

  const props = withDefaults(defineProps<PaperStaticMeshGradientProps>(), {
    colors: () => ['#ffad0a', '#6200ff', '#e2a3ff', '#ff99fd'],
    positions: 2,
    waveX: 1.0,
    waveXShift: 0.6,
    waveY: 1.0,
    waveYShift: 0.21,
    mixing: 0.93,
    grainMixer: 0.0,
    grainOverlay: 0.0,
    speed: 0,
    frame: 0,
    fit: 'contain',
    scale: 1,
    rotation: 270,
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
    u_positions: props.positions,
    u_waveX: props.waveX,
    u_waveXShift: props.waveXShift,
    u_waveY: props.waveY,
    u_waveYShift: props.waveYShift,
    u_mixing: props.mixing,
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
    :fragment-shader="staticMeshGradientFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
