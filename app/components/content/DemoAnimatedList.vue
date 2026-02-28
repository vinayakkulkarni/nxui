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
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import AnimatedList from '~/components/ui/AnimatedList.vue';
</script>

<template>
  <AnimatedList :items='items' :show-gradients='true' :enable-arrow-navigation='true' />
</template>`"
  >
    <div class="flex h-100 w-full items-center justify-center rounded-lg">
      <AnimatedList
        :items="items"
        :show-gradients="true"
        :enable-arrow-navigation="true"
      />
    </div>
  </ComponentDemo>
</template>
