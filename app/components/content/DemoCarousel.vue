<script setup lang="ts">
  import Carousel from '@registry/new-york/Carousel/Carousel.vue';
</script>

<template>
  <ComponentDemo
    :code="`<Carousel :base-width='300' :autoplay='true' :autoplay-delay='3000' :pause-on-hover='true' />`"
  >
    <div class="flex h-[400px] w-full items-center justify-center rounded-lg">
      <Carousel
        :base-width="300"
        :autoplay="true"
        :autoplay-delay="3000"
        :pause-on-hover="true"
      />
    </div>
  </ComponentDemo>
</template>
