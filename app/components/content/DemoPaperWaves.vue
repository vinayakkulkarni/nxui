<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperWaves from '@registry/new-york/paper-waves/PaperWaves.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorFront: '#ffbb00',
    colorBack: '#000000',
    shape: 1.5,
    frequency: 0.5,
    amplitude: 0.5,
    spacing: 1,
    proportion: 0.5,
    softness: 0,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'shape', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'frequency', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'spacing', { min: 0.5, max: 3, step: 0.05 });
    pane.addBinding(params, 'proportion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperWaves from '~/components/ui/paper-waves/PaperWaves.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperWaves
      :color-front=&quot;'#ffbb00'&quot;
      :color-back=&quot;'#000000'&quot;
      :shape=&quot;1.5&quot;
      :frequency=&quot;0.5&quot;
      :amplitude=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperWaves
        :color-front="params.colorFront"
        :color-back="params.colorBack"
        :shape="params.shape"
        :frequency="params.frequency"
        :amplitude="params.amplitude"
        :spacing="params.spacing"
        :proportion="params.proportion"
        :softness="params.softness"
      />
      <ShaderPane title="Waves" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
