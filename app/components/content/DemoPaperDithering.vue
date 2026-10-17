<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperDithering from '@registry/new-york/paper-dithering/PaperDithering.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperDitheringPresets } from '~/lib/paper-presets/dithering';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperDitheringPresets, [
      'colorBack',
      'colorFront',
      'shape',
      'type',
      'size',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperDitheringPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'shape', {
      options: {
        simplex: 'simplex',
        warp: 'warp',
        dots: 'dots',
        wave: 'wave',
        ripple: 'ripple',
        swirl: 'swirl',
        sphere: 'sphere',
      },
    });
    pane.addBinding(params, 'type', {
      options: { random: 'random', '2x2': '2x2', '4x4': '4x4', '8x8': '8x8' },
    });
    pane.addBinding(params, 'size', { min: 1, max: 20, step: 0.1 });
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
  import PaperDithering from '~/components/ui/paper-dithering/PaperDithering.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperDithering
      :color-back=&quot;'#000000'&quot;
      :color-front=&quot;'#00b2ff'&quot;
      :shape=&quot;'sphere'&quot;
      :type=&quot;'4x4'&quot;
      :size=&quot;2&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperDithering v-bind="params" />
      <ShaderPane expanded title="Dithering" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
