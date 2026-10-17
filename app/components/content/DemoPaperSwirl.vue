<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperSwirl from '@registry/new-york/paper-swirl/PaperSwirl.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperSwirlPresets } from '~/lib/paper-presets/swirl';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperSwirlPresets, [
      'colorBack',
      'colors',
      'bandCount',
      'twist',
      'center',
      'proportion',
      'softness',
      'noise',
      'noiseFrequency',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperSwirlPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'bandCount', { min: 0, max: 15, step: 1 });
    pane.addBinding(params, 'twist', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'center', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'proportion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'noiseFrequency', { min: 0, max: 1, step: 0.01 });
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
  import PaperSwirl from '~/components/ui/paper-swirl/PaperSwirl.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSwirl
      :color-back=&quot;'#330000'&quot;
      :colors=&quot;['#ffd1d1', '#ff8a8a', '#660000']&quot;
      :band-count=&quot;4&quot;
      :twist=&quot;0.1&quot;
      :speed=&quot;0.32&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperSwirl v-bind="params" />
      <ShaderPane expanded title="Swirl" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
