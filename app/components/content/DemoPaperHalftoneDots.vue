<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperHalftoneDots from '@registry/new-york/paper-halftone-dots/PaperHalftoneDots.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    colorFront: '#2b2b2b',
    colorBack: '#f2f1e8',
    size: 0.5,
    radius: 1.25,
    contrast: 0.4,
    grid: 'hex',
    type: 'gooey',
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'colorFront');
    pane.addBinding(params, 'colorBack');
    pane.addBinding(params, 'size', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'radius', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'contrast', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grid', {
      options: {
        Square: 'square',
        Hex: 'hex',
      },
    });
    pane.addBinding(params, 'type', {
      options: {
        Classic: 'classic',
        Gooey: 'gooey',
        Holes: 'holes',
        Soft: 'soft',
      },
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperHalftoneDots from '~/components/ui/paper-halftone-dots/PaperHalftoneDots.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperHalftoneDots
      :image=&quot;'/flowers.webp'&quot;
      :color-front=&quot;'#2b2b2b'&quot;
      :color-back=&quot;'#f2f1e8'&quot;
      :size=&quot;0.5&quot;
      :radius=&quot;1.25&quot;
      :contrast=&quot;0.4&quot;
      :grid=&quot;'hex'&quot;
      :type=&quot;'gooey'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperHalftoneDots
        image="/flowers.webp"
        :color-front="params.colorFront"
        :color-back="params.colorBack"
        :size="params.size"
        :radius="params.radius"
        :contrast="params.contrast"
        :grid="params.grid"
        :type="params.type"
      />
      <ShaderPane title="Halftone Dots" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
