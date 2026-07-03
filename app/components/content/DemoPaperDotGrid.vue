<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperDotGrid from '@registry/new-york/paper-dot-grid/PaperDotGrid.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorBack: '#000000',
    colorFill: '#ffffff',
    colorStroke: '#ffaa00',
    size: 2,
    gapX: 32,
    gapY: 32,
    shape: 'circle',
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'colorFill');
    pane.addBinding(params, 'colorStroke');
    pane.addBinding(params, 'size', { min: 1, max: 100, step: 1 });
    pane.addBinding(params, 'gapX', { min: 2, max: 500, step: 1 });
    pane.addBinding(params, 'gapY', { min: 2, max: 500, step: 1 });
    pane.addBinding(params, 'shape', {
      options: {
        Circle: 'circle',
        Diamond: 'diamond',
        Square: 'square',
        Triangle: 'triangle',
      },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperDotGrid from '~/components/ui/paper-dot-grid/PaperDotGrid.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperDotGrid
      :color-back=&quot;'#000000'&quot;
      :color-fill=&quot;'#ffffff'&quot;
      :color-stroke=&quot;'#ffaa00'&quot;
      :size=&quot;2&quot;
      :gap-x=&quot;32&quot;
      :gap-y=&quot;32&quot;
      :shape=&quot;'circle'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperDotGrid
        :color-back="params.colorBack"
        :color-fill="params.colorFill"
        :color-stroke="params.colorStroke"
        :size="params.size"
        :gap-x="params.gapX"
        :gap-y="params.gapY"
        :shape="params.shape"
      />
      <ShaderPane title="Dot Grid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
