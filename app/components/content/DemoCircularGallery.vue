<script setup lang="ts">
  import CircularGallery from '@registry/new-york/CircularGallery/CircularGallery.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import CircularGallery from '~/components/ui/CircularGallery.vue';
</script>

<template>
  <CircularGallery :bend='3' text-color='#ffffff' :border-radius='0.05' :scroll-speed='2' />
</template>`"
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
