<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperSmokeRing from '@registry/new-york/paper-smoke-ring/PaperSmokeRing.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperSmokeRingPresets } from '~/lib/paper-presets/smoke-ring';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperSmokeRingPresets, [
      'colorBack',
      'colors',
      'noiseScale',
      'noiseIterations',
      'radius',
      'thickness',
      'innerShape',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperSmokeRingPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'noiseScale', { min: 0.01, max: 5, step: 0.05 });
    pane.addBinding(params, 'noiseIterations', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'thickness', { min: 0.01, max: 1, step: 0.01 });
    pane.addBinding(params, 'innerShape', { min: 0, max: 4, step: 0.01 });
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
  import PaperSmokeRing from '~/components/ui/paper-smoke-ring/PaperSmokeRing.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSmokeRing
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#ffffff', '#ffca0a', '#fc6203', '#fc620366']&quot;
      :noise-scale=&quot;2&quot;
      :radius=&quot;0.4&quot;
      :thickness=&quot;0.8&quot;
      :inner-shape=&quot;4&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperSmokeRing v-bind="params" />
      <ShaderPane
        expanded
        title="Smoke Ring"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
