<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperStaticMeshGradient from '@registry/new-york/paper-static-mesh-gradient/PaperStaticMeshGradient.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperStaticMeshGradientPresets } from '~/lib/paper-presets/static-mesh-gradient';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperStaticMeshGradientPresets, [
      'colors',
      'positions',
      'waveX',
      'waveXShift',
      'waveY',
      'waveYShift',
      'mixing',
      'grainMixer',
      'grainOverlay',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperStaticMeshGradientPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'positions', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'waveX', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'waveXShift', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'waveY', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'waveYShift', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mixing', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainMixer', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainOverlay', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'offsetX', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'offsetY', { min: -1, max: 1, step: 0.01 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperStaticMeshGradient from '~/components/ui/paper-static-mesh-gradient/PaperStaticMeshGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperStaticMeshGradient
      :colors=&quot;['#ffad0a', '#6200ff', '#e2a3ff', '#ff99fd']&quot;
      :positions=&quot;2&quot;
      :wave-x=&quot;1.0&quot;
      :wave-y=&quot;1.0&quot;
      :mixing=&quot;0.93&quot;
      :rotation=&quot;270&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperStaticMeshGradient v-bind="params" />
      <ShaderPane
        expanded
        title="Static Mesh Gradient"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
