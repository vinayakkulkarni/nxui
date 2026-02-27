<script setup lang="ts">
  import OrbitImages from '@registry/new-york/OrbitImages/OrbitImages.vue';

  const images = [
    {
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
      alt: 'Mountains',
    },
    {
      src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=150&h=150&fit=crop',
      alt: 'Forest',
    },
    {
      src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop',
      alt: 'Trees',
    },
    {
      src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=150&h=150&fit=crop',
      alt: 'Valley',
    },
    {
      src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop',
      alt: 'Field',
    },
    {
      src: 'https://images.unsplash.com/photo-1518173946687-a1e0c2f3b8e0?w=150&h=150&fit=crop',
      alt: 'Coast',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import OrbitImages from '~/components/ui/OrbitImages.vue';
</script>

<template>
  <OrbitImages :images='images' :orbit-radius-x='280' :orbit-radius-y='120' :item-size='80' :speed='15' />
</template>`"
  >
    <div
      class="flex h-[400px] w-full items-center justify-center overflow-hidden rounded-lg bg-background"
    >
      <OrbitImages
        :images="images"
        :orbit-radius-x="280"
        :orbit-radius-y="120"
        :item-size="80"
        :speed="15"
      />
    </div>
  </ComponentDemo>
</template>
