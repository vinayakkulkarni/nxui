<script setup lang="ts">
  import PaperVoronoi from '@registry/new-york/paper-voronoi/PaperVoronoi.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperVoronoi from '~/components/ui/paper-voronoi/PaperVoronoi.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperVoronoi
      :colors=&quot;['#ff8247', '#ffe53d']&quot;
      :distortion=&quot;0.4&quot;
      :glow=&quot;0.3&quot;
      :scale=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperVoronoi
        :colors="['#ff8247', '#ffe53d']"
        :distortion="0.4"
        :glow="0.3"
        :scale="0.5"
      />
    </div>
  </ComponentDemo>
</template>
