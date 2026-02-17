<script setup lang="ts">
  import BounceCards from '@registry/new-york/BounceCards/BounceCards.vue';

  const images = [
    'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=200&auto=format',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=200&auto=format',
    'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=200&auto=format',
    'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=200&auto=format',
    'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=200&auto=format',
  ];

  const transforms = [
    'rotate(10deg) translate(-170px)',
    'rotate(5deg) translate(-85px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(85px)',
    'rotate(2deg) translate(170px)',
  ];
</script>

<template>
  <ComponentDemo
    :code="`<BounceCards :images='images' :container-width='500' :container-height='300' :enable-hover='true' />`"
  >
    <div class="flex h-[400px] w-full items-center justify-center overflow-hidden rounded-lg">
      <BounceCards
        :images="images"
        :container-width="500"
        :container-height="300"
        :transform-styles="transforms"
        :enable-hover="true"
      />
    </div>
  </ComponentDemo>
</template>
