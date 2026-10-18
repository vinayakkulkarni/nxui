<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperHalftoneCmyk from '@registry/new-york/paper-halftone-cmyk/PaperHalftoneCmyk.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperHalftoneCmykPresets } from '~/lib/paper-presets/halftone-cmyk';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperHalftoneCmykPresets, [
      'colorBack',
      'colorC',
      'colorM',
      'colorY',
      'colorK',
      'size',
      'gridNoise',
      'type',
      'softness',
      'contrast',
      'gainC',
      'gainM',
      'gainY',
      'gainK',
      'floodC',
      'floodM',
      'floodY',
      'floodK',
      'grainMixer',
      'grainSize',
      'grainOverlay',
      'scale',
      'fit',
    ]),
  );
  const presets = usePaperPresets(params, paperHalftoneCmykPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorC');
    pane.addBinding(params, 'colorM');
    pane.addBinding(params, 'colorY');
    pane.addBinding(params, 'colorK');
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'gridNoise', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'type', {
      options: { dots: 'dots', ink: 'ink', sharp: 'sharp' },
    });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'contrast', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'gainC', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'gainM', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'gainY', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'gainK', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'floodC', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'floodM', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'floodY', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'floodK', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainMixer', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainSize', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainOverlay', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.1, max: 4, step: 0.01 });
    pane.addBinding(params, 'fit', {
      options: { contain: 'contain', cover: 'cover' },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperHalftoneCmyk from '~/components/ui/paper-halftone-cmyk/PaperHalftoneCmyk.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperHalftoneCmyk
      :image=&quot;'/flowers.webp'&quot;
      :size=&quot;0.2&quot;
      :contrast=&quot;1&quot;
      :softness=&quot;1&quot;
      :type=&quot;'ink'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperHalftoneCmyk image="/flowers.webp" v-bind="params" />
      <ShaderPane
        expanded
        title="Halftone CMYK"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
