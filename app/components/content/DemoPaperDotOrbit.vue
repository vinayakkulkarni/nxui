<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperDotOrbit from '@registry/new-york/paper-dot-orbit/PaperDotOrbit.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperDotOrbitPresets } from '~/lib/paper-presets/dot-orbit';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperDotOrbitPresets, [
      'colorBack',
      'colors',
      'stepsPerColor',
      'size',
      'sizeRange',
      'spreading',
      'speed',
      'scale',
    ]),
  );
  const presets = usePaperPresets(params, paperDotOrbitPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'stepsPerColor', { min: 1, max: 4, step: 1 });
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'sizeRange', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'spreading', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 20, step: 0.1 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperDotOrbit from '~/components/ui/paper-dot-orbit/PaperDotOrbit.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperDotOrbit
      :colors=&quot;['#ffc96b', '#ff6200', '#ff2f00', '#421100', '#1a0000']&quot;
      :color-back=&quot;'#000000'&quot;
      :size=&quot;1&quot;
      :spread=&quot;1&quot;
      :steps-per-color=&quot;4&quot;
      :speed=&quot;1.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperDotOrbit v-bind="params" />
      <ShaderPane expanded title="Dot Orbit" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
