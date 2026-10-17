<script setup lang="ts">
  import { reactive, shallowRef } from 'vue';
  import PaperLensDistortion from '@registry/new-york/paper-lens-distortion/PaperLensDistortion.vue';
  import {
    getPaperLensDistortionPreset,
    isPaperLensDistortionPresetName,
    paperLensDistortionPresets,
  } from '@registry/new-york/paper-lens-distortion/paper-lens-distortion-presets.ts';
  import type { PaperLensDistortionPresetName } from '@registry/new-york/paper-lens-distortion/types';
  import type { Pane } from 'tweakpane';

  // /flowers.webp is the Paper Shaders docs default sample. The others come
  // from the same docs, pinned via jsDelivr (served with CORS).
  const SAMPLE_BASE =
    'https://cdn.jsdelivr.net/gh/paper-design/shaders@43cd68d/docs/public/images/image-filters';
  const IMAGES = {
    Flowers: '/flowers.webp',
    'Sample 1': `${SAMPLE_BASE}/001.webp`,
    'Sample 2': `${SAMPLE_BASE}/004.webp`,
    'Sample 3': `${SAMPLE_BASE}/006.webp`,
    'Sample 4': `${SAMPLE_BASE}/0013.webp`,
  };

  const presetOptions = Object.fromEntries(
    paperLensDistortionPresets.map((preset) => [preset.name, preset.name]),
  );

  const paneRef = shallowRef<Pane | null>(null);
  const state = reactive({
    preset: 'Default' as PaperLensDistortionPresetName,
    image: IMAGES.Flowers,
  });
  const params = reactive({
    ...getPaperLensDistortionPreset('Default').params,
  });

  function applyPreset(name: PaperLensDistortionPresetName) {
    Object.assign(params, getPaperLensDistortionPreset(name).params);
    state.preset = name;
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(state, 'preset', {
        options: presetOptions,
      })
      .on('change', (ev) => {
        if (isPaperLensDistortionPresetName(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(state, 'image', { options: IMAGES });
    pane.addBinding(params, 'spread', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bias', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'angle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'perspective', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'count', { min: 2, max: 50, step: 1 });
    pane.addBinding(params, 'dispersion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'dispersionShift', {
      min: -1,
      max: 1,
      step: 0.01,
    });
    pane.addBinding(params, 'dispersionColor', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'focusCenter', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'focusEdges', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'swirl', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'noiseFrequency', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'noiseOffset', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'lensBulge', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'lensCircle', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainMixer', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainOverlay', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'imageX', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'imageY', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.1, max: 4, step: 0.01 });
    pane.addBinding(params, 'fit', {
      options: { Contain: 'contain', Cover: 'cover' },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperLensDistortion from '~/components/ui/paper-lens-distortion/PaperLensDistortion.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperLensDistortion
      image=&quot;/flowers.webp&quot;
      :spread=&quot;0.6&quot;
      :perspective=&quot;0.1&quot;
      :count=&quot;35&quot;
      :dispersion-color=&quot;0.6&quot;
      :focus-center=&quot;0.8&quot;
      :swirl=&quot;0.35&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperLensDistortion :image="state.image" v-bind="params" />
      <ShaderPane
        expanded
        title="Lens Distortion"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
