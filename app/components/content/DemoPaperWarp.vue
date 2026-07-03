<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperWarp from '@registry/new-york/paper-warp/PaperWarp.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    color1: '#121212',
    color2: '#9470ff',
    color3: '#121212',
    color4: '#8838ff',
    proportion: 0.5,
    softness: 0,
    distortion: 0.3,
    swirl: 0.9,
    swirlIterations: 0,
    shapeScale: 0,
    shape: 'edge',
    speed: 0,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'proportion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'swirl', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'swirlIterations', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'shapeScale', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shape', {
      options: { Checks: 'checks', Stripes: 'stripes', Edge: 'edge' },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperWarp from '~/components/ui/paper-warp/PaperWarp.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperWarp
      :colors=&quot;['#121212', '#9470ff', '#121212', '#8838ff']&quot;
      :shape=&quot;'edge'&quot;
      :distortion=&quot;0.3&quot;
      :swirl=&quot;0.9&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperWarp
        :colors="[params.color1, params.color2, params.color3, params.color4]"
        :proportion="params.proportion"
        :softness="params.softness"
        :distortion="params.distortion"
        :swirl="params.swirl"
        :swirl-iterations="params.swirlIterations"
        :shape-scale="params.shapeScale"
        :shape="params.shape"
        :speed="params.speed"
      />
      <ShaderPane title="Warp" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
