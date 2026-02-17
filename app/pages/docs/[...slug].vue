<script setup lang="ts">
definePageMeta({ layout: 'docs' });

const route = useRoute();

const { data: page } = await useAsyncData(`page-${route.path}`, () =>
  queryCollection('docs').path(route.path).first(),
);

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  });
}

const category = route.path.split('/')[2] ?? '';
const formattedCategory = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

useSeoMeta({
  title: page.value?.title,
  description: page.value?.description,
  ogTitle: page.value?.title,
  ogDescription: page.value?.description,
  ogType: 'website',
  ogUrl: `https://nxui.geoql.in${route.path}`,
  ogSiteName: 'nxui',
  twitterCard: 'summary_large_image',
  twitterTitle: page.value?.title,
  twitterDescription: page.value?.description,
});

if (import.meta.server) {
  defineOgImageComponent('NxuiDoc', {
    title: page.value?.title,
    description: page.value?.description,
    category: formattedCategory,
  });
}
</script>

<template>
  <div v-if="page" class="space-y-16">
    <header class="space-y-4">
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
        {{ page.title }}
      </h1>
      <p
        v-if="page.description"
        class="text-muted-foreground text-lg leading-relaxed max-w-2xl"
      >
        {{ page.description }}
      </p>
    </header>
    <ContentRenderer :value="page" />
  </div>
</template>
