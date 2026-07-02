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
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperTextureProps } from './types';

  const props = withDefaults(defineProps<PaperTextureProps>(), {
    image: '',
    colorFront: '#9fadbc',
    colorBack: '#ffffff',
    contrast: 0.3,
    roughness: 0.4,
    fiber: 0.3,
    fiberSize: 0.2,
    crumples: 0.3,
    crumpleSize: 0.35,
    folds: 0.65,
    foldCount: 5,
    fade: 0,
    drops: 0.2,
    seed: 5.8,
    speed: 0,
    frame: 0,
    fit: 'cover',
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
    u_colorFront: getShaderColorFromString(props.colorFront),
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_contrast: props.contrast,
    u_roughness: props.roughness,
    u_fiber: props.fiber,
    u_fiberSize: props.fiberSize,
    u_crumples: props.crumples,
    u_crumpleSize: props.crumpleSize,
    u_foldCount: props.foldCount,
    u_folds: props.folds,
    u_fade: props.fade,
    u_drops: props.drops,
    u_seed: props.seed,
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
