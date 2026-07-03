<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperNeuroNoise from '@registry/new-york/paper-neuro-noise/PaperNeuroNoise.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorFront: '#00c8ff',
    colorMid: '#fbff00',
    colorBack: '#8b42ff',
    brightness: 0.19,
    contrast: 0.12,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'colorMid');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'brightness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'contrast', { min: 0, max: 1, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperNeuroNoise from '~/components/ui/paper-neuro-noise/PaperNeuroNoise.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperNeuroNoise
      :color-front=&quot;'#00c8ff'&quot;
      :color-mid=&quot;'#fbff00'&quot;
      :color-back=&quot;'#8b42ff'&quot;
      :brightness=&quot;0.19&quot;
      :contrast=&quot;0.12&quot;
      :scale=&quot;3&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperNeuroNoise
        :color-front="params.colorFront"
        :color-mid="params.colorMid"
        :color-back="params.colorBack"
        :brightness="params.brightness"
        :contrast="params.contrast"
        :scale="3"
      />
      <ShaderPane title="Neuro Noise" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
