<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperDotGrid from '@registry/new-york/paper-dot-grid/PaperDotGrid.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperDotGridPresets } from '~/lib/paper-presets/dot-grid';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperDotGridPresets, [
      'colorBack',
      'colorFill',
      'colorStroke',
      'shape',
      'size',
      'gapX',
      'gapY',
      'strokeWidth',
      'sizeRange',
      'opacityRange',
      'rotation',
    ]),
  );
  const presets = usePaperPresets(params, paperDotGridPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorFill');
    pane.addBinding(params, 'colorStroke');
    pane.addBinding(params, 'shape', {
      options: {
        circle: 'circle',
        diamond: 'diamond',
        square: 'square',
        triangle: 'triangle',
      },
    });
    pane.addBinding(params, 'size', { min: 1, max: 100, step: 1 });
    pane.addBinding(params, 'gapX', { min: 2, max: 500, step: 1 });
    pane.addBinding(params, 'gapY', { min: 2, max: 500, step: 1 });
    pane.addBinding(params, 'strokeWidth', { min: 0, max: 50, step: 1 });
    pane.addBinding(params, 'sizeRange', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'opacityRange', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperDotGrid from '~/components/ui/paper-dot-grid/PaperDotGrid.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperDotGrid
      :color-back=&quot;'#000000'&quot;
      :color-fill=&quot;'#ffffff'&quot;
      :color-stroke=&quot;'#ffaa00'&quot;
      :size=&quot;2&quot;
      :gap-x=&quot;32&quot;
      :gap-y=&quot;32&quot;
      :shape=&quot;'circle'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperDotGrid v-bind="params" />
      <ShaderPane expanded title="Dot Grid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
