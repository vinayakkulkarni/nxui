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

  useHead({
    link: [{ rel: 'canonical', href: 'https://nxui.geoql.in/docs' }],
  });
  useSeoMeta({
    title: page.value?.title,
    description: page.value?.description,
    ogTitle: page.value?.title,
    ogDescription: page.value?.description,
    ogType: 'website',
    ogUrl: 'https://nxui.geoql.in/docs',
    ogSiteName: 'nxui',
    twitterCard: 'summary_large_image',
    twitterSite: '@vinayakkulkarni',
    twitterTitle: page.value?.title,
    twitterDescription: page.value?.description,
  });

  defineOgImage('NxuiDoc', {
    title: page.value?.title ?? 'nxui',
    description: page.value?.description ?? '',
  });
</script>

<template>
  <div v-if="page" class="space-y-16">
    <header class="space-y-4">
      <h1
        class="font-display text-4xl font-bold md:text-5xl lg:text-6xl"
        style="letter-spacing: -0.04em; line-height: 1.1"
      >
        {{ page.title }}
      </h1>
      <p
        v-if="page.description"
        class="max-w-2xl font-serif text-lg/relaxed italic text-muted-foreground"
      >
        {{ page.description }}
      </p>
    </header>
    <ContentRenderer :value="page" />
  </div>
</template>
