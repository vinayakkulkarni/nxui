<script setup lang="ts">
  import ShapeGrid from '@registry/new-york/shape-grid/ShapeGrid.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ShapeGrid from '~/components/ui/ShapeGrid.vue';
</script>

<template>
  <ShapeGrid direction='diagonal' border-color='#271E37' hover-fill-color='#222222' :square-size='40' :speed='0.5' />
</template>`"
  >
    <div class="h-100 w-full overflow-hidden rounded-lg">
      <ClientOnly
        ><ShapeGrid
          direction="diagonal"
          border-color="#271E37"
          hover-fill-color="#222222"
          :square-size="40"
          :speed="0.5"
      /></ClientOnly>
    </div>
  </ComponentDemo>
</template>
