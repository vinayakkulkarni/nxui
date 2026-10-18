<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperMetaballs from '@registry/new-york/paper-metaballs/PaperMetaballs.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperMetaballsPresets } from '~/lib/paper-presets/metaballs';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperMetaballsPresets, [
      'colorBack',
      'colors',
      'count',
      'size',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperMetaballsPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'count', { min: 1, max: 20, step: 0.1 });
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.01 });
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
  import PaperMetaballs from '~/components/ui/paper-metaballs/PaperMetaballs.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperMetaballs
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#6e33cc', '#ff5500', '#ffc105', '#ffc800', '#f585ff']&quot;
      :count=&quot;10&quot;
      :size=&quot;0.83&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperMetaballs v-bind="params" />
      <ShaderPane expanded title="Metaballs" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
