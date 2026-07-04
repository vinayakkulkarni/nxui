<script setup lang="ts">
  // Vue wrapper for the Paper Shaders gem-smoke
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <GemSmoke> defaultPreset.
  // The image is run through `toProcessedGemSmoke` (async Poisson-based
  // edge-gradient pre-process) before being passed as the u_image uniform.
  import { computed, shallowRef, watchEffect } from 'vue';
  import {
    gemSmokeFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
    toProcessedGemSmoke,
    GemSmokeShapes,
    emptyPixel,
  } from '@paper-design/shaders';
  import PaperShaderMount from '../paper-shader-mount/PaperShaderMount.vue';
  import type { PaperGemSmokeProps } from './types';

  const props = withDefaults(defineProps<PaperGemSmokeProps>(), {
    colors: () => ['#333333', '#e7e6df'],
    colorBack: '#f0efea',
    colorInner: '#fafaf5',
    image: '',
    speed: 1,
    frame: 0,
    innerDistortion: 0.8,
    outerDistortion: 0.6,
    outerGlow: 0.55,
    innerGlow: 1,
    offset: 0,
    angle: 0,
    size: 0.8,
    shape: 'diamond',
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

  // Processed-image blob URL. Starts as emptyPixel so the shader has a valid
  // (transparent) URL before the async Poisson pre-process completes.
  const processedImageUrl = shallowRef<string>(emptyPixel);

  watchEffect(async (onCleanup) => {
    if (!props.image) {
      processedImageUrl.value = emptyPixel;
      return;
    }

    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    try {
      const result = await toProcessedGemSmoke(props.image);
      if (cancelled) return;
      const url = URL.createObjectURL(result.pngBlob);
      onCleanup(() => URL.revokeObjectURL(url));
      processedImageUrl.value = url;
    } catch {
      // Leave the previous (or emptyPixel) URL in place on failure.
    }
  });

  const uniforms = computed(() => ({
    u_colors: props.colors.map(getShaderColorFromString),
    u_colorsCount: props.colors.length,
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colorInner: getShaderColorFromString(props.colorInner),
    u_image: processedImageUrl.value,
    u_innerDistortion: props.innerDistortion,
    u_outerDistortion: props.outerDistortion,
    u_outerGlow: props.outerGlow,
    u_innerGlow: props.innerGlow,
    u_offset: props.offset,
    u_angle: props.angle,
    u_size: props.size,
    u_isImage: Boolean(props.image),
    u_shape: GemSmokeShapes[props.shape],
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
    :fragment-shader="gemSmokeFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :mipmaps="['u_image']"
    :class="props.class"
  />
</template>
