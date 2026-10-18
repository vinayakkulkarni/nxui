<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperSimplexNoise from '@registry/new-york/paper-simplex-noise/PaperSimplexNoise.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperSimplexNoisePresets } from '~/lib/paper-presets/simplex-noise';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperSimplexNoisePresets, [
      'colors',
      'stepsPerColor',
      'softness',
      'speed',
      'scale',
      'rotation',
    ]),
  );
  const presets = usePaperPresets(params, paperSimplexNoisePresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'stepsPerColor', { min: 1, max: 10, step: 1 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperSimplexNoise from '~/components/ui/paper-simplex-noise/PaperSimplexNoise.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSimplexNoise
      :colors=&quot;['#4449CF', '#FFD1E0', '#F94446', '#FFD36B', '#FFFFFF']&quot;
      :steps-per-color=&quot;2&quot;
      :softness=&quot;0&quot;
      :scale=&quot;0.6&quot;
      :speed=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperSimplexNoise v-bind="params" />
      <ShaderPane
        expanded
        title="Simplex Noise"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
