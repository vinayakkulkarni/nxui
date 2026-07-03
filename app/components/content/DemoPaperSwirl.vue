<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperSwirl from '@registry/new-york/paper-swirl/PaperSwirl.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#330000',
    color1: '#ffd1d1',
    color2: '#ff8a8a',
    color3: '#660000',
    bandCount: 4,
    twist: 0.1,
    center: 0,
    proportion: 0.5,
    softness: 0,
    noiseFrequency: 0,
    noise: 0,
    speed: 0.32,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'bandCount', { min: 0, max: 15, step: 1 });
    pane.addBinding(params, 'twist', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'center', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'proportion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'noiseFrequency', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'noise', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperSwirl from '~/components/ui/paper-swirl/PaperSwirl.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSwirl
      :color-back=&quot;'#330000'&quot;
      :colors=&quot;['#ffd1d1', '#ff8a8a', '#660000']&quot;
      :band-count=&quot;4&quot;
      :twist=&quot;0.1&quot;
      :speed=&quot;0.32&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperSwirl
        :color-back="params.colorBack"
        :colors="[params.color1, params.color2, params.color3]"
        :band-count="params.bandCount"
        :twist="params.twist"
        :center="params.center"
        :proportion="params.proportion"
        :softness="params.softness"
        :noise-frequency="params.noiseFrequency"
        :noise="params.noise"
        :speed="params.speed"
      />
      <ShaderPane title="Swirl" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
