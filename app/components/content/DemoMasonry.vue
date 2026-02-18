<script setup lang="ts">
  import Masonry from '@registry/new-york/Masonry/Masonry.vue';

  const items = [
    { id: 1, img: 'https://picsum.photos/seed/a/400/600', height: 600 },
    { id: 2, img: 'https://picsum.photos/seed/b/400/400', height: 400 },
    { id: 3, img: 'https://picsum.photos/seed/c/400/500', height: 500 },
    { id: 4, img: 'https://picsum.photos/seed/d/400/300', height: 300 },
    { id: 5, img: 'https://picsum.photos/seed/e/400/450', height: 450 },
    { id: 6, img: 'https://picsum.photos/seed/f/400/350', height: 350 },
    { id: 7, img: 'https://picsum.photos/seed/g/400/550', height: 550 },
    { id: 8, img: 'https://picsum.photos/seed/h/400/400', height: 400 },
    { id: 9, img: 'https://picsum.photos/seed/i/400/500', height: 500 },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Masonry from '~/components/ui/Masonry.vue';
</script>

<template>
  <Masonry :items='items' :scale-on-hover='true' :hover-scale='0.95' :blur-to-focus='true' />
</template>`"
    full-width
  >
    <div class="relative w-full" style="min-height: 500px">
      <Masonry
        :items="items"
        :scale-on-hover="true"
        :hover-scale="0.95"
        :blur-to-focus="true"
      />
    </div>
  </ComponentDemo>
</template>
