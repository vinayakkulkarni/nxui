<script setup lang="ts">
  // Vue wrapper for the Paper Shaders perlin-noise
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <PerlinNoise> defaultPreset.
  import { computed } from 'vue';
  import {
    perlinNoiseFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperPerlinNoiseProps } from './types';

  const props = withDefaults(defineProps<PaperPerlinNoiseProps>(), {
    colorFront: '#fccff7',
    colorBack: '#632ad5',
    proportion: 0.35,
    softness: 0.1,
    octaveCount: 1,
    persistence: 1,
    lacunarity: 1.5,
    speed: 0.5,
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
    u_colorFront: getShaderColorFromString(props.colorFront),
    u_proportion: props.proportion,
    u_softness: props.softness,
    u_octaveCount: props.octaveCount,
    u_persistence: props.persistence,
    u_lacunarity: props.lacunarity,
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
    :fragment-shader="perlinNoiseFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :class="props.class"
  />
</template>
