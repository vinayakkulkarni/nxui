<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperPulsingBorder from '@registry/new-york/paper-pulsing-border/PaperPulsingBorder.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperPulsingBorderPresets } from '~/lib/paper-presets/pulsing-border';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperPulsingBorderPresets, [
      'colorBack',
      'colors',
      'roundness',
      'thickness',
      'softness',
      'aspectRatio',
      'intensity',
      'bloom',
      'spotSize',
      'spots',
      'pulse',
      'smoke',
      'smokeSize',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
      'marginLeft',
      'marginRight',
      'marginTop',
      'marginBottom',
    ]),
  );
  const presets = usePaperPresets(params, paperPulsingBorderPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'roundness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'thickness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'aspectRatio', {
      options: { auto: 'auto', square: 'square' },
    });
    pane.addBinding(params, 'intensity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bloom', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'spotSize', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'spots', { min: 1, max: 4, step: 1 });
    pane.addBinding(params, 'pulse', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'smoke', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'smokeSize', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'offsetX', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'offsetY', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'marginLeft', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'marginRight', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'marginTop', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'marginBottom', { min: 0, max: 1, step: 0.01 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperPulsingBorder from '~/components/ui/paper-pulsing-border/PaperPulsingBorder.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperPulsingBorder
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#0dc1fd', '#d915ef', '#ff3f2ecc']&quot;
      :roundness=&quot;0.25&quot;
      :thickness=&quot;0.1&quot;
      :softness=&quot;0.75&quot;
      :bloom=&quot;0.25&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperPulsingBorder class="absolute inset-0 size-full" v-bind="params" />
      <ShaderPane
        expanded
        title="Pulsing Border"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
