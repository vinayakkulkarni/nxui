<script setup lang="ts">
  import GridDistortion from '@registry/new-york/grid-distortion/GridDistortion.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GridDistortion from '~/components/ui/GridDistortion.vue';
</script>

<template>
  <GridDistortion image-src='https://picsum.photos/1200/800' :grid='15' :mouse='0.1' :strength='0.15' :relaxation='0.9' />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
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
