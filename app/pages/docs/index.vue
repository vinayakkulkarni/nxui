<script setup lang="ts">
definePageMeta({ layout: 'docs' });

const { data: page } = await useAsyncData('docs-intro', () =>
  queryCollection('docs').path('/docs').first(),
);

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  });
}

useSeoMeta({
  title: page.value?.title,
  description: page.value?.description,
  ogTitle: page.value?.title,
  ogDescription: page.value?.description,
  ogType: 'website',
  ogUrl: 'https://nxui.geoql.in/docs',
  ogSiteName: 'nxui',
  twitterCard: 'summary_large_image',
  twitterTitle: page.value?.title,
  twitterDescription: page.value?.description,
});

if (import.meta.server) {
  defineOgImage({
    component: 'NxuiDoc',
    title: page.value?.title ?? 'nxui',
    description: page.value?.description ?? '',
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
