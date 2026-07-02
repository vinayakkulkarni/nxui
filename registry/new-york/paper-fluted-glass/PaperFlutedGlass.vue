<script setup lang="ts">
  // Vue wrapper for the Paper Shaders fluted-glass
  // (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
  // Mirrors @paper-design/shaders-react's <FlutedGlass> defaultPreset.
  import { computed } from 'vue';
  import {
    flutedGlassFragmentShader,
    getShaderColorFromString,
    GlassDistortionShapes,
    GlassGridShapes,
    ShaderFitOptions,
  } from '@paper-design/shaders';
  import PaperShaderMount from './PaperShaderMount.vue';
  import type { PaperFlutedGlassProps } from './types';

  const props = withDefaults(defineProps<PaperFlutedGlassProps>(), {
    image: '',
    colorBack: '#00000000',
    colorShadow: '#000000',
    colorHighlight: '#ffffff',
    shadows: 0.25,
    size: 0.5,
    angle: 0,
    distortion: 0.5,
    distortionShape: 'prism',
    highlights: 0.1,
    shape: 'lines',
    shift: 0,
    blur: 0,
    edges: 0.25,
    stretch: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    grainMixer: 0,
    grainOverlay: 0,
    speed: 0,
    frame: 0,
    fit: 'cover',
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
    u_colorBack: getShaderColorFromString(props.colorBack),
    u_colorShadow: getShaderColorFromString(props.colorShadow),
    u_colorHighlight: getShaderColorFromString(props.colorHighlight),
    u_shadows: props.shadows,
    u_size: props.size,
    u_angle: props.angle,
    u_distortion: props.distortion,
    u_shift: props.shift,
    u_blur: props.blur,
    u_edges: props.edges,
    u_stretch: props.stretch,
    u_distortionShape: GlassDistortionShapes[props.distortionShape],
    u_highlights: props.highlights,
    u_shape: GlassGridShapes[props.shape],
    u_marginLeft: props.marginLeft,
    u_marginRight: props.marginRight,
    u_marginTop: props.marginTop,
    u_marginBottom: props.marginBottom,
    u_grainMixer: props.grainMixer,
    u_grainOverlay: props.grainOverlay,
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
    :fragment-shader="flutedGlassFragmentShader"
    :uniforms="uniforms"
    :speed="props.speed"
    :frame="props.frame"
    :mipmaps="['u_image']"
    :class="props.class"
  />
</template>
