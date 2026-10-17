<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperSpiral from '@registry/new-york/paper-spiral/PaperSpiral.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperSpiralPresets } from '~/lib/paper-presets/spiral';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperSpiralPresets, [
      'colorBack',
      'colorFront',
      'density',
      'distortion',
      'strokeWidth',
      'strokeTaper',
      'strokeCap',
      'noise',
      'noiseFrequency',
      'softness',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperSpiralPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'density', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'strokeWidth', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'strokeTaper', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'strokeCap', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'noiseFrequency', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
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
  import PaperSpiral from '~/components/ui/paper-spiral/PaperSpiral.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSpiral
      :color-front=&quot;'#79D1FF'&quot;
      :color-back=&quot;'#001429'&quot;
      :density=&quot;0.7&quot;
      :stroke-width=&quot;0.6&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperSpiral v-bind="params" />
      <ShaderPane expanded title="Spiral" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
