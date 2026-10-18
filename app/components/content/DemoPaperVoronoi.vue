<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperVoronoi from '@registry/new-york/paper-voronoi/PaperVoronoi.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperVoronoiPresets } from '~/lib/paper-presets/voronoi';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperVoronoiPresets, [
      'colorGlow',
      'colorGap',
      'colors',
      'stepsPerColor',
      'distortion',
      'gap',
      'glow',
      'speed',
      'scale',
      'rotation',
    ]),
  );
  const presets = usePaperPresets(params, paperVoronoiPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorGlow');
    pane.addBinding(params, 'colorGap');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'stepsPerColor', { min: 1, max: 3, step: 1 });
    pane.addBinding(params, 'distortion', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'gap', { min: 0, max: 0.1, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperVoronoi from '~/components/ui/paper-voronoi/PaperVoronoi.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperVoronoi
      :colors=&quot;['#ff8247', '#ffe53d']&quot;
      :distortion=&quot;0.4&quot;
      :glow=&quot;0.3&quot;
      :scale=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperVoronoi v-bind="params" />
      <ShaderPane expanded title="Voronoi" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
