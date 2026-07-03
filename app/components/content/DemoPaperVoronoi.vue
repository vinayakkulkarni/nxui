<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperVoronoi from '@registry/new-york/paper-voronoi/PaperVoronoi.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color1: '#ff8247',
    color2: '#ffe53d',
    stepsPerColor: 1,
    colorGlow: '#ffffff',
    colorGap: '#000000',
    distortion: 0.4,
    gap: 0,
    glow: 0.3,
    speed: 0,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'stepsPerColor', { min: 1, max: 10, step: 1 });
    pane.addBinding(params, 'colorGlow');
    pane.addBinding(params, 'colorGap');
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'gap', { min: 0, max: 0.1, step: 0.005 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperVoronoi from '~/components/ui/paper-voronoi/PaperVoronoi.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperVoronoi
      :colors=&quot;['#ff8247', '#ffe53d']&quot;
      :distortion=&quot;0.4&quot;
      :glow=&quot;0.3&quot;
      :scale=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperVoronoi
        :colors="[params.color1, params.color2]"
        :steps-per-color="params.stepsPerColor"
        :color-glow="params.colorGlow"
        :color-gap="params.colorGap"
        :distortion="params.distortion"
        :gap="params.gap"
        :glow="params.glow"
        :speed="params.speed"
      />
      <ShaderPane title="Voronoi" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
