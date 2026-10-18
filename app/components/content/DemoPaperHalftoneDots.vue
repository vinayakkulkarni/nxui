<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperHalftoneDots from '@registry/new-york/paper-halftone-dots/PaperHalftoneDots.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperHalftoneDotsPresets } from '~/lib/paper-presets/halftone-dots';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperHalftoneDotsPresets, [
      'colorBack',
      'colorFront',
      'originalColors',
      'type',
      'grid',
      'inverted',
      'size',
      'radius',
      'contrast',
      'grainMixer',
      'grainOverlay',
      'grainSize',
      'scale',
      'fit',
    ]),
  );
  const presets = usePaperPresets(params, paperHalftoneDotsPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'originalColors');
    pane.addBinding(params, 'type', {
      options: {
        classic: 'classic',
        gooey: 'gooey',
        holes: 'holes',
        soft: 'soft',
      },
    });
    pane.addBinding(params, 'grid', {
      options: { square: 'square', hex: 'hex' },
    });
    pane.addBinding(params, 'inverted');
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.001 });
    pane.addBinding(params, 'radius', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'contrast', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainMixer', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainOverlay', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainSize', { min: 0, max: 1, step: 0.01 });
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
  import PaperHalftoneDots from '~/components/ui/paper-halftone-dots/PaperHalftoneDots.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperHalftoneDots
      :image=&quot;'/flowers.webp'&quot;
      :color-front=&quot;'#2b2b2b'&quot;
      :color-back=&quot;'#f2f1e8'&quot;
      :size=&quot;0.5&quot;
      :radius=&quot;1.25&quot;
      :contrast=&quot;0.4&quot;
      :grid=&quot;'hex'&quot;
      :type=&quot;'gooey'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperHalftoneDots image="/flowers.webp" v-bind="params" />
      <ShaderPane
        expanded
        title="Halftone Dots"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
