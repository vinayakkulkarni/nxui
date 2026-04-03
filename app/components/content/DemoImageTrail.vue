<script setup lang="ts">
  import ImageTrail from '@registry/new-york/image-trail/ImageTrail.vue';

  const images = [
    'https://picsum.photos/190/209?random=1',
    'https://picsum.photos/190/209?random=2',
    'https://picsum.photos/190/209?random=3',
    'https://picsum.photos/190/209?random=4',
    'https://picsum.photos/190/209?random=5',
    'https://picsum.photos/190/209?random=6',
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ImageTrail from '~/components/ui/ImageTrail.vue';
</script>

<template>
  <ImageTrail :images='images' :sensitivity='80' :fade-out-duration='1200' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <ImageTrail :images="images" :sensitivity="80" :fade-out-duration="1200">
        <p class="text-lg text-foreground/50">Move your mouse around</p>
      </ImageTrail>
    </div>
  </ComponentDemo>
</template>
