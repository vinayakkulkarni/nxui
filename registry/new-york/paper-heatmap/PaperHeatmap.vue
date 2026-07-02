<script setup lang="ts">
  // Vue wrapper for the Paper Shaders heatmap
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <Heatmap> defaultPreset.
  // The image is preprocessed via `toProcessedHeatmap` on the client (extracts
  // contour + inner/outer blur channels from the alpha into an RGB mask) before
  // being passed to the shader.
  import { computed, ref, watchEffect, onBeforeUnmount } from 'vue';
  import {
    heatmapFragmentShader,
    getShaderColorFromString,
    toProcessedHeatmap,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperHeatmapProps } from './types';

  const props = withDefaults(defineProps<PaperHeatmapProps>(), {
    image: '',
    contour: 0.5,
    angle: 0,
    noise: 0,
    innerGlow: 0.5,
    outerGlow: 0.5,
    colorBack: '#000000',
    colors: () => [
      '#11206a',
      '#1f3ba2',
      '#2f63e7',
      '#6bd7ff',
      '#ffe679',
      '#ff991e',
      '#ff4c00',
    ],
    speed: 1,
    frame: 0,
    fit: 'contain',
    scale: 0.75,
    rotation: 0,
    originX: 0.5,
    originY: 0.5,
    offsetX: 0,
    offsetY: 0,
    worldWidth: 0,
    worldHeight: 0,
    class: '',
  });

  // Processed-image URL — starts as the plain input, then is replaced with a
  // blob URL once `toProcessedHeatmap` resolves (client-only).
  const processedImage = ref<string>(props.image);
  const currentBlobUrl = ref<string | null>(null);

  watchEffect(async () => {
    if (typeof window === 'undefined') return;
    const src = props.image;
    if (!src) {
      processedImage.value = '';
      return;
    }

    // Preprocess the image (mirror upstream React `useLayoutEffect` flow).
    try {
      const { blob } = await toProcessedHeatmap(src);
      const newUrl = URL.createObjectURL(blob);
      const previous = currentBlobUrl.value;
      currentBlobUrl.value = newUrl;
      processedImage.value = newUrl;
      if (previous) URL.revokeObjectURL(previous);
    } catch {
      // Fall back to the original image URL on failure.
      processedImage.value = src;
    }
  });

  onBeforeUnmount(() => {
    if (currentBlobUrl.value) URL.revokeObjectURL(currentBlobUrl.value);
  });

  const uniforms = computed(() => ({
    u_image: processedImage.value,
    u_contour: props.contour,
    u_angle: props.angle,
    u_noise: props.noise,
    u_innerGlow: props.innerGlow,
    u_outerGlow: props.outerGlow,
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colors: props.colors.map(getShaderColorFromString),
    u_colorsCount: props.colors.length,
    u_fit: ShaderFitOptions[props.fit],
    u_offsetX: props.offsetX,
    u_offsetY: props.offsetY,
    u_originX: props.originX,
    u_originY: props.originY,
    u_rotation: props.rotation,
    u_scale: props.scale,
    u_worldHeight: props.worldHeight,
    u_worldWidth: props.worldWidth,
  }));
</script>

<template>
  <PaperShaderMount
    :fragment-shader="heatmapFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :mipmaps="['u_image']"
    :class="props.class"
  />
</template>
