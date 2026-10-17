<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperWater from '@registry/new-york/paper-water/PaperWater.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperWaterPresets } from '~/lib/paper-presets/water';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperWaterPresets, [
      'colorBack',
      'colorHighlight',
      'highlights',
      'layering',
      'edges',
      'waves',
      'caustic',
      'size',
      'speed',
      'scale',
      'fit',
    ]),
  );
  const presets = usePaperPresets(params, paperWaterPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorHighlight');
    pane.addBinding(params, 'highlights', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'layering', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'edges', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'waves', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'caustic', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'size', { min: 0.01, max: 7, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.1, max: 4, step: 0.01 });
    pane.addBinding(params, 'fit', {
      options: { contain: 'contain', cover: 'cover' },
    });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperWater from '~/components/ui/paper-water/PaperWater.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperWater image=&quot;/flowers.webp&quot; :highlights=&quot;0.07&quot; :caustic=&quot;0.1&quot; :waves=&quot;0.3&quot; />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperWater image="/flowers.webp" v-bind="params" />
      <ShaderPane expanded title="Water" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
