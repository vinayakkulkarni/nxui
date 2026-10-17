<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperGemSmoke from '@registry/new-york/paper-gem-smoke/PaperGemSmoke.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperGemSmokePresets } from '~/lib/paper-presets/gem-smoke';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperGemSmokePresets, [
      'colorBack',
      'colorInner',
      'colors',
      'shape',
      'innerDistortion',
      'outerDistortion',
      'outerGlow',
      'innerGlow',
      'offset',
      'angle',
      'size',
      'speed',
      'scale',
    ]),
  );
  const presets = usePaperPresets(params, paperGemSmokePresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorInner');
    presets.addColorsFolder(pane);
    pane.addBinding(params, 'shape', {
      options: {
        none: 'none',
        circle: 'circle',
        daisy: 'daisy',
        diamond: 'diamond',
        metaballs: 'metaballs',
      },
    });
    pane.addBinding(params, 'innerDistortion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'outerDistortion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'outerGlow', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'innerGlow', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'offset', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'angle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'speed', { min: 0, max: 4, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.1, max: 4, step: 0.01 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperGemSmoke from '~/components/ui/paper-gem-smoke/PaperGemSmoke.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperGemSmoke
      :image=&quot;'/flowers.webp'&quot;
      :colors=&quot;['#333333', '#e7e6df']&quot;
      :color-back=&quot;'#f0efea'&quot;
      :color-inner=&quot;'#fafaf5'&quot;
      :inner-glow=&quot;1&quot;
      :outer-glow=&quot;0.55&quot;
      :shape=&quot;'diamond'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperGemSmoke image="/flowers.webp" v-bind="params" />
      <ShaderPane expanded title="Gem Smoke" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
