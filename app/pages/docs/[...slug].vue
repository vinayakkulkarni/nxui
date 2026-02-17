<script setup lang="ts">
  definePageMeta({ layout: 'docs' });

  const route = useRoute();
  const path =
    route.path.endsWith('/') && route.path !== '/'
      ? route.path.slice(0, -1)
      : route.path;

  const { data: page } = await useAsyncData(`page-${path}`, () =>
    queryCollection('docs').path(path).first(),
  );

  if (!page.value) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
      fatal: true,
    });
  }

  const category = route.path.split('/')[2] ?? '';
  const formattedCategory = category
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

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

  defineOgImage('NxuiDoc', {
    title: page.value?.title ?? 'nxui',
    description: page.value?.description ?? '',
    category: formattedCategory,
  });
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
