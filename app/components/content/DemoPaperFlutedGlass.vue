<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperFlutedGlass from '@registry/new-york/paper-fluted-glass/PaperFlutedGlass.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    distortion: 0.5,
    shape: 'lines',
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shape', {
      options: {
        Lines: 'lines',
        'Lines Irregular': 'linesIrregular',
        Wave: 'wave',
        Zigzag: 'zigzag',
        Pattern: 'pattern',
      },
    });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperFlutedGlass from '~/components/ui/paper-fluted-glass/PaperFlutedGlass.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperFlutedGlass image=&quot;/flowers.webp&quot; :distortion=&quot;0.5&quot; shape=&quot;lines&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperFlutedGlass
        image="/flowers.webp"
        :distortion="params.distortion"
        :shape="params.shape"
      />
      <ShaderPane title="Fluted Glass" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
