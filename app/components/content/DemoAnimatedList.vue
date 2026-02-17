<script setup lang="ts">
  import AnimatedList from '@registry/new-york/AnimatedList/AnimatedList.vue';

  const items = [
    'Build responsive layouts with Tailwind',
    'Implement dark mode toggle',
    'Add smooth page transitions',
    'Create reusable composables',
    'Set up CI/CD pipeline',
    'Write unit tests with Vitest',
    'Optimize bundle size',
    'Add SEO meta tags',
    'Implement auth flow',
    'Deploy to Cloudflare Pages',
  ];
</script>

<template>
  <ComponentDemo
    :code="`<AnimatedList :items='items' :show-gradients='true' :enable-arrow-navigation='true' />`"
  >
    <div class="flex h-[400px] w-full items-center justify-center rounded-lg">
      <AnimatedList :items="items" :show-gradients="true" :enable-arrow-navigation="true" />
    </div>
  </ComponentDemo>
</template>
