<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperColorPanels from '@registry/new-york/paper-color-panels/PaperColorPanels.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperColorPanelsPresets } from '~/lib/paper-presets/color-panels';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperColorPanelsPresets, [
      'colorBack',
      'colors',
      'density',
      'angle1',
      'angle2',
      'length',
      'edges',
      'blur',
      'fadeIn',
      'fadeOut',
      'gradient',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperColorPanelsPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'density', { min: 0.25, max: 7, step: 0.05 });
    pane.addBinding(params, 'angle1', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'angle2', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'length', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'edges');
    pane.addBinding(params, 'blur', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'fadeIn', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'fadeOut', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'gradient', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 4, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'offsetX', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'offsetY', { min: -1, max: 1, step: 0.01 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperColorPanels from '~/components/ui/paper-color-panels/PaperColorPanels.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperColorPanels
      :colors=&quot;['#ff9d00', '#fd4f30', '#809bff', '#6d2eff', '#333aff', '#f15cff', '#ffd557']&quot;
      :color-back=&quot;'#000000'&quot;
      :length=&quot;1.1&quot;
      :density=&quot;3&quot;
      :speed=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperColorPanels class="absolute inset-0 size-full" v-bind="params" />
      <ShaderPane
        expanded
        title="Color Panels"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
