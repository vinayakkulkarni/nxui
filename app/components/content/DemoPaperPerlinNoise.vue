<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperPerlinNoise from '@registry/new-york/paper-perlin-noise/PaperPerlinNoise.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorFront: '#fccff7',
    colorBack: '#632ad5',
    proportion: 0.35,
    octaveCount: 2,
    speed: 0.5,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'proportion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'octaveCount', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
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
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperPerlinNoise
        :color-front="params.colorFront"
        :color-back="params.colorBack"
        :proportion="params.proportion"
        :octave-count="params.octaveCount"
        :speed="params.speed"
      />
      <ShaderPane title="Perlin Noise" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
