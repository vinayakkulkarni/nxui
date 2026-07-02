<script setup lang="ts">
  import PaperHeatmap from '@registry/new-york/paper-heatmap/PaperHeatmap.vue';
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
        :contour="0.5"
        :inner-glow="0.5"
        :outer-glow="0.5"
      />
    </div>
  </ComponentDemo>
</template>
