<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperMeshGradient from '@registry/new-york/paper-mesh-gradient/PaperMeshGradient.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperMeshGradientPresets } from '~/lib/paper-presets/mesh-gradient';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperMeshGradientPresets, [
      'colors',
      'distortion',
      'swirl',
      'grainMixer',
      'grainOverlay',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperMeshGradientPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'swirl', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainMixer', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainOverlay', { min: 0, max: 1, step: 0.01 });
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
  import PaperMeshGradient from '~/components/ui/paper-mesh-gradient/PaperMeshGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperMeshGradient
      :colors=&quot;['#e0eaff', '#241d9a', '#f75092', '#9f50d3']&quot;
      :distortion=&quot;0.8&quot;
      :swirl=&quot;0.1&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperMeshGradient v-bind="params" />
      <ShaderPane
        expanded
        title="Mesh Gradient"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
