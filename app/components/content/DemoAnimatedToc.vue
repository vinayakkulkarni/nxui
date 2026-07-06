<script setup lang="ts">
  import AnimatedToc from '@registry/new-york/animated-toc/AnimatedToc.vue';

  const items = [
    { label: 'Introduction', depth: 0 },
    { label: 'Core Concepts', depth: 0 },
    { label: 'Architecture', depth: 1 },
    { label: 'Data Flow', depth: 1 },
    { label: 'Components', depth: 0 },
    { label: 'Button', depth: 1 },
    { label: 'Card', depth: 1 },
    { label: 'Input', depth: 1 },
    { label: 'Utilities', depth: 0 },
    { label: 'Deployment', depth: 0 },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import AnimatedToc from '~/components/ui/animated-toc/AnimatedToc.vue';

  const items = [
    { label: 'Introduction', depth: 0 },
    { label: 'Core Concepts', depth: 0 },
    { label: 'Architecture', depth: 1 },
    { label: 'Data Flow', depth: 1 },
    { label: 'Components', depth: 0 },
    { label: 'Deployment', depth: 0 },
  ];
</script>

<template>
  <AnimatedToc :items=&quot;items&quot; title=&quot;On this page&quot; />
</template>`"
  >
    <div class="flex w-full justify-center p-6">
      <AnimatedToc :items="items" />
    </div>
  </ComponentDemo>
</template>
