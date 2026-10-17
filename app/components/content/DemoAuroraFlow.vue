<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import AuroraFlow from '@registry/new-york/aurora-flow/AuroraFlow.vue';
  import {
    AURORA_FLOW_PRESETS,
    AURORA_FLOW_PRESET_NAMES,
  } from '@registry/new-york/aurora-flow/aurora-flow-presets.ts';
  import type { AuroraFlowPreset } from '@registry/new-york/aurora-flow/types';
  import type { Pane } from 'tweakpane';

  const initialPreset: AuroraFlowPreset = 'ocean';

  const params = reactive({
    preset: initialPreset,
    base: '#020817',
    depth: '#062a55',
    flow: '#0b62b4',
    light: '#39bfe6',
    sheen: '#d9f6ff',
    intensity: 1,
    opacity: 1,
    blur: 1,
    contrast: 1.04,
    brightness: 1,
    layers: 6,
    borderRadius: 0,
    speed: 1,
    animationSpeed: 1,
    flowScale: 1,
    flowStrength: 1,
    flowDirection: -18,
    pointerInteraction: true,
    pointerStrength: 0.7,
    scrollInteraction: false,
    parallaxStrength: 0.5,
    lighting: true,
    lightingIntensity: 0.8,
    lightingRadius: 1,
    lightingSpeed: 0.8,
    ambientGlow: true,
    ambientOpacity: 0.7,
    grain: true,
    grainOpacity: 0.22,
    noise: true,
    noiseOpacity: 0.16,
    noiseScale: 1,
    vignette: true,
    vignetteStrength: 0.55,
  });

  const colors = computed(() => [
    params.base,
    params.depth,
    params.flow,
    params.light,
    params.sheen,
  ]);

  const presetOptions = Object.fromEntries(
    AURORA_FLOW_PRESET_NAMES.map((name) => [name, name]),
  );

  let pane: Pane | null = null;

  function applyPreset() {
    const [base, depth, flow, light, sheen] =
      AURORA_FLOW_PRESETS[params.preset];
    Object.assign(params, { base, depth, flow, light, sheen });
    pane?.refresh();
  }

  function onPaneCreated(created: Pane) {
    pane = created;
    created
      .addBinding(params, 'preset', { options: presetOptions })
      .on('change', applyPreset);

    const palette = created.addFolder({
      title: 'Custom palette',
      expanded: false,
    });
    palette.addBinding(params, 'base');
    palette.addBinding(params, 'depth');
    palette.addBinding(params, 'flow');
    palette.addBinding(params, 'light');
    palette.addBinding(params, 'sheen');

    const composition = created.addFolder({ title: 'Composition' });
    composition.addBinding(params, 'intensity', { min: 0, max: 2, step: 0.05 });
    composition.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    composition.addBinding(params, 'blur', {
      label: 'diffusion',
      min: 0.25,
      max: 2,
      step: 0.05,
    });
    composition.addBinding(params, 'contrast', {
      min: 0.6,
      max: 1.6,
      step: 0.05,
    });
    composition.addBinding(params, 'brightness', {
      min: 0.5,
      max: 1.5,
      step: 0.05,
    });
    composition.addBinding(params, 'layers', { min: 3, max: 7, step: 1 });
    composition.addBinding(params, 'borderRadius', {
      label: 'border-radius',
      min: 0,
      max: 64,
      step: 1,
    });

    const flowFolder = created.addFolder({ title: 'Flow', expanded: false });
    flowFolder.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    flowFolder.addBinding(params, 'animationSpeed', {
      label: 'animation-speed',
      min: 0,
      max: 3,
      step: 0.05,
    });
    flowFolder.addBinding(params, 'flowScale', {
      label: 'flow-scale',
      min: 0.35,
      max: 2.5,
      step: 0.05,
    });
    flowFolder.addBinding(params, 'flowStrength', {
      label: 'flow-strength',
      min: 0,
      max: 2,
      step: 0.05,
    });
    flowFolder.addBinding(params, 'flowDirection', {
      label: 'flow-direction',
      min: -180,
      max: 180,
      step: 1,
    });

    const interaction = created.addFolder({
      title: 'Interaction',
      expanded: false,
    });
    interaction.addBinding(params, 'pointerInteraction', {
      label: 'pointer-interaction',
    });
    interaction.addBinding(params, 'pointerStrength', {
      label: 'pointer-strength',
      min: 0,
      max: 1.5,
      step: 0.05,
    });
    interaction.addBinding(params, 'scrollInteraction', {
      label: 'scroll-interaction',
    });
    interaction.addBinding(params, 'parallaxStrength', {
      label: 'parallax-strength',
      min: 0,
      max: 1.5,
      step: 0.05,
    });

    const lightingFolder = created.addFolder({
      title: 'Lighting',
      expanded: false,
    });
    lightingFolder.addBinding(params, 'lighting');
    lightingFolder.addBinding(params, 'lightingIntensity', {
      label: 'lighting-intensity',
      min: 0,
      max: 2,
      step: 0.05,
    });
    lightingFolder.addBinding(params, 'lightingRadius', {
      label: 'lighting-radius',
      min: 0.3,
      max: 2,
      step: 0.05,
    });
    lightingFolder.addBinding(params, 'lightingSpeed', {
      label: 'lighting-speed',
      min: 0,
      max: 2,
      step: 0.05,
    });
    lightingFolder.addBinding(params, 'ambientGlow', { label: 'ambient-glow' });
    lightingFolder.addBinding(params, 'ambientOpacity', {
      label: 'ambient-opacity',
      min: 0,
      max: 1.5,
      step: 0.05,
    });

    const atmosphere = created.addFolder({
      title: 'Atmosphere',
      expanded: false,
    });
    atmosphere.addBinding(params, 'grain');
    atmosphere.addBinding(params, 'grainOpacity', {
      label: 'grain-opacity',
      min: 0,
      max: 1,
      step: 0.02,
    });
    atmosphere.addBinding(params, 'noise');
    atmosphere.addBinding(params, 'noiseOpacity', {
      label: 'noise-opacity',
      min: 0,
      max: 1,
      step: 0.02,
    });
    atmosphere.addBinding(params, 'noiseScale', {
      label: 'noise-scale',
      min: 0.4,
      max: 3,
      step: 0.05,
    });
    atmosphere.addBinding(params, 'vignette');
    atmosphere.addBinding(params, 'vignetteStrength', {
      label: 'vignette-strength',
      min: 0,
      max: 1.5,
      step: 0.05,
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import AuroraFlow from '~/components/ui/aurora-flow/AuroraFlow.vue';
</script>

<template>
  <AuroraFlow
    preset=&quot;ocean&quot;
    :speed=&quot;1&quot;
    :intensity=&quot;1&quot;
    :flow-direction=&quot;-18&quot;
    :pointer-strength=&quot;0.7&quot;
    :lighting-intensity=&quot;0.8&quot;
    :grain-opacity=&quot;0.22&quot;
    class=&quot;min-h-150&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-80">
      <AuroraFlow
        :preset="params.preset"
        :colors="colors"
        :intensity="params.intensity"
        :opacity="params.opacity"
        :blur="params.blur"
        :contrast="params.contrast"
        :brightness="params.brightness"
        :layers="params.layers"
        :border-radius="params.borderRadius"
        :speed="params.speed"
        :animation-speed="params.animationSpeed"
        :flow-scale="params.flowScale"
        :flow-strength="params.flowStrength"
        :flow-direction="params.flowDirection"
        :pointer-interaction="params.pointerInteraction"
        :pointer-strength="params.pointerStrength"
        :scroll-interaction="params.scrollInteraction"
        :parallax-strength="params.parallaxStrength"
        :lighting="params.lighting"
        :lighting-intensity="params.lightingIntensity"
        :lighting-radius="params.lightingRadius"
        :lighting-speed="params.lightingSpeed"
        :ambient-glow="params.ambientGlow"
        :ambient-opacity="params.ambientOpacity"
        :grain="params.grain"
        :grain-opacity="params.grainOpacity"
        :noise="params.noise"
        :noise-opacity="params.noiseOpacity"
        :noise-scale="params.noiseScale"
        :vignette="params.vignette"
        :vignette-strength="params.vignetteStrength"
        class="absolute inset-0 size-full min-h-0"
      />
      <ShaderPane title="Aurora Flow" @on-pane-created="onPaneCreated" />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center font-mono text-xs text-white/50"
      >
        move your cursor to bend the flow
      </p>
    </div>
  </ComponentDemo>
</template>
