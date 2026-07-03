<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperLiquidMetal from '@registry/new-york/paper-liquid-metal/PaperLiquidMetal.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#AAAAAC',
    colorTint: '#ffffff',
    contour: 0.4,
    distortion: 0.07,
    repetition: 2,
    shape: 'diamond',
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorTint');
    pane.addBinding(params, 'contour', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'repetition', { min: 1, max: 10, step: 0.5 });
    pane.addBinding(params, 'shape', {
      options: {
        None: 'none',
        Circle: 'circle',
        Daisy: 'daisy',
        Diamond: 'diamond',
        Metaballs: 'metaballs',
      },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperLiquidMetal from '~/components/ui/paper-liquid-metal/PaperLiquidMetal.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperLiquidMetal
      :image=&quot;'/flowers.webp'&quot;
      :color-back=&quot;'#AAAAAC'&quot;
      :color-tint=&quot;'#ffffff'&quot;
      :contour=&quot;0.4&quot;
      :distortion=&quot;0.07&quot;
      :repetition=&quot;2&quot;
      :shape=&quot;'diamond'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperLiquidMetal
        image="/flowers.webp"
        :color-back="params.colorBack"
        :color-tint="params.colorTint"
        :contour="params.contour"
        :distortion="params.distortion"
        :repetition="params.repetition"
        :shape="params.shape"
      />
      <ShaderPane title="Liquid Metal" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
