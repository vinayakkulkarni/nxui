<script setup lang="ts">
  // Vue wrapper for the Paper Shaders liquid-metal
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <LiquidMetal> defaultPreset.
  // The image is run through `toProcessedLiquidMetal` (async Poisson-based
  // edge-gradient pre-process) before being passed as the u_image uniform.
  import { computed, shallowRef, watchEffect } from 'vue';
  import {
    liquidMetalFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
    toProcessedLiquidMetal,
    LiquidMetalShapes,
    emptyPixel,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperLiquidMetalProps } from './types';

  const props = withDefaults(defineProps<PaperLiquidMetalProps>(), {
    colorBack: '#AAAAAC',
    colorTint: '#ffffff',
    image: '',
    speed: 1,
    frame: 0,
    contour: 0.4,
    distortion: 0.07,
    softness: 0.1,
    repetition: 2,
    shiftRed: 0.3,
    shiftBlue: 0.3,
    angle: 70,
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
      const result = await toProcessedLiquidMetal(props.image);
      if (cancelled) return;
      const url = URL.createObjectURL(result.pngBlob);
      onCleanup(() => URL.revokeObjectURL(url));
      processedImageUrl.value = url;
    } catch {
      // Leave the previous (or emptyPixel) URL in place on failure.
    }
  });

  const uniforms = computed(() => ({
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colorTint: getShaderColorFromString(props.colorTint),
    u_image: processedImageUrl.value,
    u_contour: props.contour,
    u_distortion: props.distortion,
    u_softness: props.softness,
    u_repetition: props.repetition,
    u_shiftRed: props.shiftRed,
    u_shiftBlue: props.shiftBlue,
    u_angle: props.angle,
    u_isImage: Boolean(props.image),
    u_shape: LiquidMetalShapes[props.shape],
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
    :fragment-shader="liquidMetalFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :mipmaps="['u_image']"
    :class="props.class"
  />
</template>
