<script setup lang="ts">
  // Vue wrapper for the Paper Shaders paper-texture
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <PaperTexture> defaultPreset.
  import { computed, ref, watchEffect } from 'vue';
  import {
    paperTextureFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperTextureProps } from './types';

  const props = withDefaults(defineProps<PaperTextureProps>(), {
    image: '',
    colorBack: '#d3d2ab',
    colorPaper: '#ffffff',
    colorShadow: '#cccccc',
    blending: 1,
    distortion: 0.75,
    clip: false,
    angle: 300,
    seed: 4,
    roughness: 0.4,
    roughnessSize: 0.5,
    roughnessRows: 0,
    fiber: 0.4,
    fiberSize: 0.5,
    folds: 0.5,
    foldSizeX: 1,
    foldSizeY: 1,
    foldOffsetX: 0,
    foldOffsetY: 0,
    wrinkles: 1,
    wrinkleSize: 0.65,
    crumples: 0,
    crumpleCount: 6,
    drops: 0.4,
    speed: 0,
    frame: 0,
    fit: 'contain',
    scale: 0.9,
    rotation: 0,
    originX: 0.5,
    originY: 0.5,
    offsetX: 0,
    offsetY: 0,
    worldWidth: 0,
    worldHeight: 0,
    class: '',
  });

  // Noise texture is client-only — mirrors React's `typeof window !== 'undefined'` guard.
  const noiseTexture = ref<HTMLImageElement | null>(null);
  watchEffect(() => {
    if (typeof window !== 'undefined' && !noiseTexture.value) {
      const tex = getShaderNoiseTexture();
      noiseTexture.value = tex ?? null;
    }
  });

  const uniforms = computed(() => ({
    u_image: props.image,
    u_isImage: Boolean(props.image),
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colorPaper: getShaderColorFromString(props.colorPaper),
    u_colorShadow: getShaderColorFromString(props.colorShadow),
    u_blending: props.blending,
    u_distortion: props.distortion,
    u_clip: props.clip,
    u_angle: props.angle,
    u_seed: props.seed,
    u_roughness: props.roughness,
    u_roughnessSize: props.roughnessSize,
    u_roughnessRows: props.roughnessRows,
    u_fiber: props.fiber,
    u_fiberSize: props.fiberSize,
    u_folds: props.folds,
    u_foldSizeX: props.foldSizeX,
    u_foldSizeY: props.foldSizeY,
    u_foldOffsetX: props.foldOffsetX,
    u_foldOffsetY: props.foldOffsetY,
    u_wrinkles: props.wrinkles,
    u_wrinkleSize: props.wrinkleSize,
    u_crumples: props.crumples,
    u_crumpleCount: props.crumpleCount,
    u_drops: props.drops,
    ...(noiseTexture.value ? { u_noiseTexture: noiseTexture.value } : {}),
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
    :fragment-shader="paperTextureFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :mipmaps="['u_image']"
    :class="props.class"
  />
</template>
