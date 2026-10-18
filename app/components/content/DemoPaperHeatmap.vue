<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperHeatmap from '@registry/new-york/paper-heatmap/PaperHeatmap.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperHeatmapPresets } from '~/lib/paper-presets/heatmap';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperHeatmapPresets, [
      'colorBack',
      'colors',
      'contour',
      'angle',
      'noise',
      'innerGlow',
      'outerGlow',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperHeatmapPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'contour', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'angle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'innerGlow', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'outerGlow', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.1, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'offsetX', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'offsetY', { min: -1, max: 1, step: 0.01 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperHeatmap from '~/components/ui/paper-heatmap/PaperHeatmap.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperHeatmap image=&quot;/flowers.webp&quot; :contour=&quot;0.5&quot; :inner-glow=&quot;0.5&quot; :outer-glow=&quot;0.5&quot; />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperHeatmap image="/flowers.webp" v-bind="params" />
      <ShaderPane expanded title="Heatmap" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
