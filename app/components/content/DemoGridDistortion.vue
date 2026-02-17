<script setup lang="ts">
  import GridDistortion from '@registry/new-york/GridDistortion/GridDistortion.vue';
</script>

<template>
  <ComponentDemo
    :code="`<GridDistortion image-src='https://picsum.photos/1200/800' :grid='15' :mouse='0.1' :strength='0.15' :relaxation='0.9' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg">
      <GridDistortion
        image-src="https://picsum.photos/1200/800"
        :grid="15"
        :mouse="0.1"
        :strength="0.15"
        :relaxation="0.9"
      />
    </div>
  </ComponentDemo>
</template>
