<script setup lang="ts">
  import Carousel from '@registry/new-york/Carousel/Carousel.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Carousel from '~/components/ui/Carousel.vue';
</script>

<template>
  <Carousel :base-width='300' :autoplay='true' :autoplay-delay='3000' :pause-on-hover='true' />
</template>`"
  >
    <div class="flex h-100 w-full items-center justify-center rounded-lg">
      <Carousel
        :base-width="300"
        :autoplay="true"
        :autoplay-delay="3000"
        :pause-on-hover="true"
      />
    </div>
  </ComponentDemo>
</template>
