<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperFlutedGlass from '@registry/new-york/paper-fluted-glass/PaperFlutedGlass.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperFlutedGlassPresets } from '~/lib/paper-presets/fluted-glass';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperFlutedGlassPresets, [
      'colorBack',
      'colorShadow',
      'colorHighlight',
      'shadows',
      'highlights',
      'size',
      'shape',
      'angle',
      'distortionShape',
      'distortion',
      'shift',
      'stretch',
      'blur',
      'edges',
      'margin',
      'grainMixer',
      'grainOverlay',
      'scale',
      'fit',
    ]),
  );
  const presets = usePaperPresets(params, paperFlutedGlassPresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorShadow');
    pane.addBinding(params, 'colorHighlight');
    pane.addBinding(params, 'shadows', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'highlights', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.001 });
    pane.addBinding(params, 'shape', {
      options: {
        lines: 'lines',
        'lines-irregular': 'linesIrregular',
        wave: 'wave',
        zigzag: 'zigzag',
        pattern: 'pattern',
      },
    });
    pane.addBinding(params, 'angle', { min: 0, max: 180, step: 1 });
    pane.addBinding(params, 'distortionShape', {
      options: {
        prism: 'prism',
        lens: 'lens',
        contour: 'contour',
        cascade: 'cascade',
        flat: 'flat',
      },
    });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'shift', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'stretch', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'blur', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'edges', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'margin', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainMixer', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainOverlay', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.1, max: 4, step: 0.01 });
    pane.addBinding(params, 'fit', {
      options: { contain: 'contain', cover: 'cover' },
    });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperFlutedGlass from '~/components/ui/paper-fluted-glass/PaperFlutedGlass.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperFlutedGlass image=&quot;/flowers.webp&quot; :distortion=&quot;0.5&quot; shape=&quot;lines&quot; />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperFlutedGlass image="/flowers.webp" v-bind="params" />
      <ShaderPane
        expanded
        title="Fluted Glass"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
