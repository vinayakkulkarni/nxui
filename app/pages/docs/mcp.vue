<script setup lang="ts">
  definePageMeta({ layout: 'docs' });

  const { data: page } = await useAsyncData('docs-mcp', () =>
    queryCollection('docs').path('/docs/mcp').first(),
  );

  if (!page.value) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
      fatal: true,
    });
  }

  useHead({
    link: [{ rel: 'canonical', href: 'https://nxui.geoql.in/docs/mcp' }],
  });

  const socialTitle = 'MCP · nxui';
  useSeoMeta({
    title: page.value?.title,
    description: page.value?.description,
    ogTitle: socialTitle,
    ogDescription: page.value?.description,
    ogType: 'website',
    ogUrl: 'https://nxui.geoql.in/docs/mcp',
    ogSiteName: 'nxui',
    twitterCard: 'summary_large_image',
    twitterSite: '@vinayakkulkarni',
    twitterTitle: socialTitle,
    twitterDescription: page.value?.description,
  });
</script>

<template>
  <div v-if="page" class="space-y-10">
    <header class="space-y-4">
      <h1
        class="font-display text-4xl font-bold md:text-5xl"
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
