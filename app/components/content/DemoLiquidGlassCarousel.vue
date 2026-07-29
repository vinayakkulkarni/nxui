<script setup lang="ts">
  import LiquidGlassCarousel from '@registry/new-york/liquid-glass-carousel/LiquidGlassCarousel.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LiquidGlassCarousel from '~/components/ui/liquid-glass-carousel/LiquidGlassCarousel.vue';

  const items = [
    {
      src: '/img1.png',
      brand: 'Nothing',
      desc: 'Phone (2a) Launch Microsite',
    },
    {
      src: '/img2.png',
      brand: 'Apple',
      desc: '330 P4 Experience Page Concept',
    },
    // ...
  ];
</script>

<template>
  <LiquidGlassCarousel :items=&quot;items&quot; class=&quot;h-screen&quot; />
</template>`"
  >
    <div class="relative size-full min-h-80">
      <LiquidGlassCarousel
        :min-viewport-width="640"
        :config="{ panelH: 300 }"
        class="absolute inset-0 size-full"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-1 z-20 text-center text-[10px] text-black/40"
      >
        scroll to glide — click an image to focus it
      </p>
    </div>
  </ComponentDemo>
</template>
