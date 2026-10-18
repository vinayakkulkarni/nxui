<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperWarp from '@registry/new-york/paper-warp/PaperWarp.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperWarpPresets } from '~/lib/paper-presets/warp';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperWarpPresets, [
      'colors',
      'proportion',
      'softness',
      'distortion',
      'swirl',
      'swirlIterations',
      'shape',
      'shapeScale',
      'speed',
      'scale',
      'rotation',
    ]),
  );
  const presets = usePaperPresets(params, paperWarpPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'proportion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'swirl', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'swirlIterations', { min: 2, max: 20, step: 1 });
    pane.addBinding(params, 'shape', {
      options: { checks: 'checks', stripes: 'stripes', edge: 'edge' },
    });
    pane.addBinding(params, 'shapeScale', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 20, step: 0.1 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperWarp from '~/components/ui/paper-warp/PaperWarp.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperWarp
      :colors=&quot;['#121212', '#9470ff', '#121212', '#8838ff']&quot;
      :shape=&quot;'edge'&quot;
      :distortion=&quot;0.3&quot;
      :swirl=&quot;0.9&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperWarp v-bind="params" />
      <ShaderPane expanded title="Warp" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
