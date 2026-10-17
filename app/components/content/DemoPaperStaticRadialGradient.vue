<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperStaticRadialGradient from '@registry/new-york/paper-static-radial-gradient/PaperStaticRadialGradient.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperStaticRadialGradientPresets } from '~/lib/paper-presets/static-radial-gradient';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperStaticRadialGradientPresets, [
      'colorBack',
      'colors',
      'radius',
      'focalDistance',
      'falloff',
      'focalAngle',
      'mixing',
      'distortion',
      'distortionShift',
      'distortionFreq',
      'grainMixer',
      'grainOverlay',
      'offsetX',
      'offsetY',
      'speed',
    ]),
  );
  const presets = usePaperPresets(params, paperStaticRadialGradientPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'radius', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'focalDistance', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'falloff', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'focalAngle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'mixing', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'distortionShift', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'distortionFreq', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'grainMixer', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainOverlay', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'offsetX', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'offsetY', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperStaticRadialGradient from '~/components/ui/paper-static-radial-gradient/PaperStaticRadialGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperStaticRadialGradient
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#00bbff', '#00ffe1', '#ffffff']&quot;
      :radius=&quot;0.8&quot;
      :focal-distance=&quot;0.99&quot;
      :falloff=&quot;0.24&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperStaticRadialGradient v-bind="params" />
      <ShaderPane
        expanded
        title="Static Radial Gradient"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
