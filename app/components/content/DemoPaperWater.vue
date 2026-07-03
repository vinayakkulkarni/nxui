<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperWater from '@registry/new-york/paper-water/PaperWater.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#000000',
    colorHighlight: '#ffffff',
    highlights: 0.07,
    layering: 0,
    edges: 0,
    caustic: 0.1,
    waves: 0.3,
    size: 1,
    speed: 0,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorHighlight');
    pane.addBinding(params, 'highlights', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'layering', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'edges', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'caustic', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'waves', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'size', { min: 0.01, max: 7, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperWater from '~/components/ui/paper-water/PaperWater.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperWater image=&quot;/flowers.webp&quot; :highlights=&quot;0.07&quot; :caustic=&quot;0.1&quot; :waves=&quot;0.3&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperWater
        image="/flowers.webp"
        :color-back="params.colorBack"
        :color-highlight="params.colorHighlight"
        :highlights="params.highlights"
        :layering="params.layering"
        :edges="params.edges"
        :caustic="params.caustic"
        :waves="params.waves"
        :size="params.size"
        :speed="params.speed"
      />
      <ShaderPane title="Water" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
