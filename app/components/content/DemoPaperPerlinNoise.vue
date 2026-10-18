<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperPerlinNoise from '@registry/new-york/paper-perlin-noise/PaperPerlinNoise.vue';
  import {
    pickPaperPreset,
    usePaperPresets,
  } from '~/composables/use-paper-presets';
  import { paperPerlinNoisePresets } from '~/lib/paper-presets/perlin-noise';
  import type { Pane } from 'tweakpane';

  const params = reactive(
    pickPaperPreset(paperPerlinNoisePresets, [
      'colorBack',
      'colorFront',
      'proportion',
      'softness',
      'octaveCount',
      'persistence',
      'lacunarity',
      'speed',
      'scale',
      'rotation',
    ]),
  );
  const presets = usePaperPresets(params, paperPerlinNoisePresets);

  function onPaneCreated(pane: Pane) {
    presets.addPresetBinding(pane);
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'proportion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'octaveCount', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'persistence', { min: 0.3, max: 1, step: 0.01 });
    pane.addBinding(params, 'lacunarity', { min: 1.5, max: 10, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.01, max: 4, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperPerlinNoise from '~/components/ui/paper-perlin-noise/PaperPerlinNoise.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperPerlinNoise
      :color-front=&quot;'#fccff7'&quot;
      :color-back=&quot;'#632ad5'&quot;
      :proportion=&quot;0.35&quot;
      :octave-count=&quot;2&quot;
      :speed=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <PaperPerlinNoise v-bind="params" />
      <ShaderPane
        expanded
        title="Perlin Noise"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
