<script setup lang="ts">
  import CircularGallery from '@registry/new-york/CircularGallery/CircularGallery.vue';
</script>

<template>
  <ComponentDemo
    :code="`<CircularGallery :bend='3' text-color='#ffffff' :border-radius='0.05' :scroll-speed='2' />`"
  >
    <div class="relative h-[500px] w-full overflow-hidden rounded-lg">
      <CircularGallery
        :bend="3"
        text-color="#ffffff"
        :border-radius="0.05"
        :scroll-speed="2"
      />
    </div>
  </ComponentDemo>
</template>
