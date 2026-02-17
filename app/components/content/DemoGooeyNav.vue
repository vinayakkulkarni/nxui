<script setup lang="ts">
  import GooeyNav from '@registry/new-york/GooeyNav/GooeyNav.vue';

  const items = [
    { label: 'Home' },
    { label: 'About' },
    { label: 'Contact' },
    { label: 'Blog' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<GooeyNav :items='items' :particle-count='15' :initial-active-index='0' />`"
  >
    <div class="flex h-[200px] w-full items-center justify-center rounded-lg bg-neutral-950">
      <GooeyNav :items="items" :particle-count="15" :initial-active-index="0" />
    </div>
  </ComponentDemo>
</template>
