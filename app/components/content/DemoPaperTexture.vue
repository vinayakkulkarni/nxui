<script setup lang="ts">
  import { reactive, shallowRef } from 'vue';
  import PaperTexture from '@registry/new-york/paper-texture/PaperTexture.vue';
  import {
    getPaperTexturePreset,
    isPaperTexturePresetName,
    paperTexturePresets,
  } from '@registry/new-york/paper-texture/paper-texture-presets';
  import type { PaperTexturePresetName } from '@registry/new-york/paper-texture/types';
  import type { Pane } from 'tweakpane';

  // /flowers.webp is the Paper Shaders docs default sample. The others come
  // from the same docs, pinned via jsDelivr (served with CORS).
  const SAMPLE_BASE =
    'https://cdn.jsdelivr.net/gh/paper-design/shaders@43cd68d/docs/public/images/image-filters';
  const IMAGES = {
    None: '',
    Flowers: '/flowers.webp',
    'Sample 1': `${SAMPLE_BASE}/001.webp`,
    'Sample 2': `${SAMPLE_BASE}/004.webp`,
    'Sample 3': `${SAMPLE_BASE}/006.webp`,
    'Sample 4': `${SAMPLE_BASE}/0013.webp`,
  };

  const presetOptions = Object.fromEntries(
    paperTexturePresets.map((preset) => [preset.name, preset.name]),
  );

  const paneRef = shallowRef<Pane | null>(null);
  const state = reactive({
    preset: 'Default' as PaperTexturePresetName,
    image: IMAGES.Flowers,
  });
  // Tweakpane keeps the hex format it first sees, so every color stays
  // #rrggbbaa. Otherwise a 6-digit start drops preset alpha (Spread, Flat).
  function withAlpha(hex: string): string {
    return hex.length === 7 ? `${hex}ff` : hex;
  }

  function presetParams(name: PaperTexturePresetName) {
    const preset = getPaperTexturePreset(name).params;
    return {
      ...preset,
      colorBack: withAlpha(preset.colorBack),
      colorPaper: withAlpha(preset.colorPaper),
      colorShadow: withAlpha(preset.colorShadow),
    };
  }

  const params = reactive(presetParams('Default'));

  function applyPreset(name: PaperTexturePresetName) {
    Object.assign(params, presetParams(name));
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
        if (isPaperTexturePresetName(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(state, 'image', { options: IMAGES });
    pane.addBinding(params, 'colorBack', { color: { alpha: true } });
    pane.addBinding(params, 'colorPaper', { color: { alpha: true } });
    pane.addBinding(params, 'colorShadow', { color: { alpha: true } });
    pane.addBinding(params, 'blending', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'distortion', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'clip');
    pane.addBinding(params, 'angle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'seed', { min: 0, max: 1000, step: 1 });
    pane.addBinding(params, 'roughness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'roughnessSize', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'roughnessRows', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'fiber', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'fiberSize', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'folds', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'foldSizeX', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'foldSizeY', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'foldOffsetX', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'foldOffsetY', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'wrinkles', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'wrinkleSize', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'crumples', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'crumpleCount', { min: 2, max: 15, step: 1 });
    pane.addBinding(params, 'drops', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.5, max: 10, step: 0.01 });
    pane.addBinding(params, 'fit', {
      options: { Contain: 'contain', Cover: 'cover' },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperTexture from '~/components/ui/paper-texture/PaperTexture.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperTexture
      image=&quot;/flowers.webp&quot;
      color-back=&quot;#d3d2ab&quot;
      color-paper=&quot;#ffffff&quot;
      color-shadow=&quot;#cccccc&quot;
      :distortion=&quot;0.75&quot;
      :angle=&quot;300&quot;
      :folds=&quot;0.5&quot;
      :wrinkles=&quot;1&quot;
      :drops=&quot;0.4&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperTexture :image="state.image" v-bind="params" />
      <ShaderPane
        expanded
        title="Paper Texture"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
