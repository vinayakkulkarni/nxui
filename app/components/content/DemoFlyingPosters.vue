<script setup lang="ts">
  import FlyingPosters from '@registry/new-york/FlyingPosters/FlyingPosters.vue';

  const images = [
    'https://picsum.photos/seed/10/600/600',
    'https://picsum.photos/seed/11/600/600',
    'https://picsum.photos/seed/12/600/600',
    'https://picsum.photos/seed/13/600/600',
    'https://picsum.photos/seed/14/600/600',
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FlyingPosters from '~/components/ui/FlyingPosters.vue';
</script>

<template>
  <FlyingPosters :items='images' :plane-width='320' :plane-height='320' :distortion='3' />
</template>`"
  >
    <div class="relative h-[500px] w-full overflow-hidden rounded-lg bg-black">
      <FlyingPosters
        :items="images"
        :plane-width="320"
        :plane-height="320"
        :distortion="3"
      />
    </div>
  </ComponentDemo>
</template>
