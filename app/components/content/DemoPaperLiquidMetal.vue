<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperLiquidMetal from '@registry/new-york/paper-liquid-metal/PaperLiquidMetal.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperLiquidMetalPresets } from '~/lib/paper-presets/liquid-metal';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperLiquidMetalPresets, [
      'colorBack',
      'colorTint',
      'shape',
      'repetition',
      'softness',
      'shiftRed',
      'shiftBlue',
      'distortion',
      'contour',
      'angle',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
      'fit',
    ]),
  );
  const presets = usePaperPresets(params, paperLiquidMetalPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorTint');
    pane.addBinding(params, 'shape', {
      options: {
        none: 'none',
        circle: 'circle',
        daisy: 'daisy',
        diamond: 'diamond',
        metaballs: 'metaballs',
      },
    });
    pane.addBinding(params, 'repetition', { min: 1, max: 10, step: 0.05 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'shiftRed', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'shiftBlue', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'contour', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'angle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 4, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.1, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'offsetX', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'offsetY', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'fit', {
      options: { contain: 'contain', cover: 'cover' },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperLiquidMetal from '~/components/ui/paper-liquid-metal/PaperLiquidMetal.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperLiquidMetal
      :image=&quot;'/flowers.webp'&quot;
      :color-back=&quot;'#AAAAAC'&quot;
      :color-tint=&quot;'#ffffff'&quot;
      :contour=&quot;0.4&quot;
      :distortion=&quot;0.07&quot;
      :repetition=&quot;2&quot;
      :shape=&quot;'diamond'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperLiquidMetal image="/flowers.webp" v-bind="params" />
      <ShaderPane
        expanded
        title="Liquid Metal"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
