<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperNeuroNoise from '@registry/new-york/paper-neuro-noise/PaperNeuroNoise.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperNeuroNoisePresets } from '~/lib/paper-presets/neuro-noise';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperNeuroNoisePresets, [
      'colorFront',
      'colorMid',
      'colorBack',
      'brightness',
      'contrast',
      'speed',
      'scale',
      'rotation',
    ]),
  );
  const presets = usePaperPresets(params, paperNeuroNoisePresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'colorMid');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'brightness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'contrast', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperNeuroNoise from '~/components/ui/paper-neuro-noise/PaperNeuroNoise.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperNeuroNoise
      :color-front=&quot;'#00c8ff'&quot;
      :color-mid=&quot;'#fbff00'&quot;
      :color-back=&quot;'#8b42ff'&quot;
      :brightness=&quot;0.19&quot;
      :contrast=&quot;0.12&quot;
      :scale=&quot;3&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperNeuroNoise v-bind="params" />
      <ShaderPane
        expanded
        title="Neuro Noise"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
