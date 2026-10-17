<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperGodRays from '@registry/new-york/paper-god-rays/PaperGodRays.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperGodRaysPresets } from '~/lib/paper-presets/god-rays';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperGodRaysPresets, [
      'colorBack',
      'colorBloom',
      'colors',
      'bloom',
      'intensity',
      'density',
      'spotty',
      'midSize',
      'midIntensity',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperGodRaysPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorBloom');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'bloom', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'intensity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'density', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'spotty', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'midSize', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'midIntensity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.01 });
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
  import PaperGodRays from '~/components/ui/paper-god-rays/PaperGodRays.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperGodRays
      :colors=&quot;['#a600ff6e', '#6200fff0', '#ffffff', '#33fff5']&quot;
      :intensity=&quot;0.8&quot;
      :bloom=&quot;0.5&quot;
      :offset-y=&quot;-0.55&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperGodRays v-bind="params" />
      <ShaderPane expanded title="God Rays" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
