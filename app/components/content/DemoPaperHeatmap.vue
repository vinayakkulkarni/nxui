<script setup lang="ts">
  import { reactive } from 'vue';
  import PaperHeatmap from '@registry/new-york/paper-heatmap/PaperHeatmap.vue';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    contour: 0.5,
    innerGlow: 0.5,
    outerGlow: 0.5,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'contour', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'innerGlow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'outerGlow', { min: 0, max: 1, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperHeatmap from '~/components/ui/paper-heatmap/PaperHeatmap.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperHeatmap image=&quot;/flowers.webp&quot; :contour=&quot;0.5&quot; :inner-glow=&quot;0.5&quot; :outer-glow=&quot;0.5&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperHeatmap
        image="/flowers.webp"
        :contour="params.contour"
        :inner-glow="params.innerGlow"
        :outer-glow="params.outerGlow"
      />
      <ShaderPane title="Heatmap" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
