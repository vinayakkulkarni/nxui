<script setup lang="ts">
  import WarpGallery from '@registry/new-york/warp-gallery/WarpGallery.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import WarpGallery from '~/components/ui/warp-gallery/WarpGallery.vue';

  const items = [
    {
      image: '/covers/nothing.jpg',
      title: 'Nothing',
      subtitle: 'Phone (2a) Launch Microsite',
    },
    {
      image: '/covers/ferrari.jpg',
      title: 'Ferrari',
      subtitle: 'GT Apparel Capsule',
    },
    // ...
  ];
</script>

<template>
  <WarpGallery :items=&quot;items&quot; :bend=&quot;1&quot; :aberration=&quot;1&quot; class=&quot;h-120&quot; />
</template>`"
  >
    <div class="relative size-full min-h-80 bg-white dark:bg-background">
      <WarpGallery class="absolute inset-0 size-full" />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-1 z-10 text-center text-[10px] text-muted-foreground/60"
      >
        scroll or drag — velocity bends the strip
      </p>
    </div>
  </ComponentDemo>
</template>
