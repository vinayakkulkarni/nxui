<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperImageDithering from '@registry/new-york/paper-image-dithering/PaperImageDithering.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperImageDitheringPresets } from '~/lib/paper-presets/image-dithering';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperImageDitheringPresets, [
      'colorBack',
      'colorFront',
      'colorHighlight',
      'originalColors',
      'inverted',
      'type',
      'size',
      'colorSteps',
      'scale',
      'fit',
    ]),
  );
  const presets = usePaperPresets(params, paperImageDitheringPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'colorHighlight');
    pane.addBinding(params, 'originalColors');
    pane.addBinding(params, 'inverted');
    pane.addBinding(params, 'type', {
      options: { random: 'random', '2x2': '2x2', '4x4': '4x4', '8x8': '8x8' },
    });
    pane.addBinding(params, 'size', { min: 0.5, max: 20, step: 0.1 });
    pane.addBinding(params, 'colorSteps', { min: 1, max: 7, step: 1 });
    pane.addBinding(params, 'scale', { min: 0.1, max: 4, step: 0.01 });
    pane.addBinding(params, 'fit', {
      options: { contain: 'contain', cover: 'cover' },
    });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperImageDithering from '~/components/ui/paper-image-dithering/PaperImageDithering.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperImageDithering image=&quot;/flowers.webp&quot; type=&quot;8x8&quot; :color-steps=&quot;2&quot; />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperImageDithering
        class="absolute inset-0 size-full"
        image="/flowers.webp"
        v-bind="params"
      />
      <ShaderPane
        expanded
        title="Image Dithering"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
