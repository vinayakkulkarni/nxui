<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperGrainGradient from '@registry/new-york/paper-grain-gradient/PaperGrainGradient.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperGrainGradientPresets } from '~/lib/paper-presets/grain-gradient';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperGrainGradientPresets, [
      'colorBack',
      'colors',
      'softness',
      'intensity',
      'noise',
      'shape',
      'speed',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
    ]),
  );
  const presets = usePaperPresets(params, paperGrainGradientPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'intensity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'shape', {
      options: {
        wave: 'wave',
        dots: 'dots',
        truchet: 'truchet',
        corners: 'corners',
        ripple: 'ripple',
        blob: 'blob',
        sphere: 'sphere',
      },
    });
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
  import PaperGrainGradient from '~/components/ui/paper-grain-gradient/PaperGrainGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperGrainGradient
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#7300ff', '#eba8ff', '#00bfff', '#2a00ff']&quot;
      :softness=&quot;0.5&quot;
      :intensity=&quot;0.5&quot;
      :noise=&quot;0.25&quot;
      :shape=&quot;'corners'&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperGrainGradient v-bind="params" />
      <ShaderPane
        expanded
        title="Grain Gradient"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
