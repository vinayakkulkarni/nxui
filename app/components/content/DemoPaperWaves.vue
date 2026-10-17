<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperWaves from '@registry/new-york/paper-waves/PaperWaves.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperWavesPresets } from '~/lib/paper-presets/waves';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperWavesPresets, [
      'colorBack',
      'colorFront',
      'frequency',
      'amplitude',
      'spacing',
      'proportion',
      'softness',
      'shape',
      'scale',
      'rotation',
    ]),
  );
  const presets = usePaperPresets(params, paperWavesPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'frequency', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'spacing', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'proportion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'shape', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperWaves from '~/components/ui/paper-waves/PaperWaves.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperWaves
      :color-front=&quot;'#ffbb00'&quot;
      :color-back=&quot;'#000000'&quot;
      :shape=&quot;1.5&quot;
      :frequency=&quot;0.5&quot;
      :amplitude=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperWaves v-bind="params" />
      <ShaderPane expanded title="Waves" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
