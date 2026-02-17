<script setup lang="ts">
  import PixelCard from '@registry/new-york/PixelCard/PixelCard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<PixelCard variant='blue'>
  <h3 class='text-xl font-bold text-white'>Hover Me</h3>
</PixelCard>`"
  >
    <div class="flex h-[500px] w-full items-center justify-center rounded-lg">
      <PixelCard variant="blue">
        <h3 class="text-xl font-bold text-white">Hover Me</h3>
      </PixelCard>
    </div>
  </ComponentDemo>
</template>
