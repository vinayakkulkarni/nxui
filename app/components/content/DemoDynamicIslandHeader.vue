<script setup lang="ts">
  import { ref } from 'vue';
  import DynamicIslandHeader from '@registry/new-york/dynamic-island-header/DynamicIslandHeader.vue';

  const container = ref<HTMLElement | null>(null);

  const links = [
    { label: 'Programming', href: '#programming' },
    { label: 'Nutrition', href: '#nutrition' },
    { label: 'Assistant', href: '#assistant' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const sections = [
    { id: 'programming', label: 'Programming' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'assistant', label: 'Assistant' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faq', label: 'FAQ' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DynamicIslandHeader from '~/components/ui/dynamic-island-header/DynamicIslandHeader.vue';

  const links = [
    { label: 'Programming', href: '#programming' },
    { label: 'Nutrition', href: '#nutrition' },
    { label: 'Assistant', href: '#assistant' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];
</script>

<template>
  <DynamicIslandHeader
    :links=&quot;links&quot;
    :threshold=&quot;80&quot;
    :compact-width=&quot;260&quot;
    default-label=&quot;Overview&quot;
    sign-in-label=&quot;Sign in&quot;
    cta-label=&quot;Start free trial&quot;
  />
</template>`"
  >
    <div
      ref="container"
      class="relative h-100 w-full overflow-y-auto rounded-lg bg-neutral-100 dark:bg-neutral-900/40"
    >
      <div class="sticky top-4 z-10 flex justify-center px-4">
        <DynamicIslandHeader
          class="w-full max-w-3xl"
          :links="links"
          :threshold="80"
          :compact-width="240"
          default-label="Overview"
          :container="container"
        />
      </div>

      <section
        v-for="section in sections"
        :id="section.id"
        :key="section.id"
        class="flex h-80 items-center justify-center"
      >
        <span
          class="font-display text-6xl text-neutral-300 italic dark:text-neutral-700"
        >
          {{ section.label }}
        </span>
      </section>
    </div>
  </ComponentDemo>
</template>
