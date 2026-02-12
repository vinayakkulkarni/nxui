<script setup lang="ts">
  definePageMeta({
    layout: 'docs',
  });

  const route = useRoute();

  const slug = computed(() => {
    const params = route.params.slug;
    return Array.isArray(params) ? params.join('/') : params;
  });

  const { data: page } = await useAsyncData(`docs-${slug.value}`, () =>
    queryCollection('docs').path(`/docs/components/${slug.value}`).first(),
  );

  useHead({
    title: computed(
      () => `${page.value?.title ?? 'Component'} - nxui`,
    ),
  });
</script>

<template>
  <div v-if="page" class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">
        {{ page.title }}
      </h1>
      <p
        v-if="page.description"
        class="mt-2 text-lg text-muted-foreground"
      >
        {{ page.description }}
      </p>
    </div>

    <ContentRenderer :value="page" />
  </div>
  <div v-else class="py-20 text-center">
    <h1 class="text-2xl font-bold">Component not found</h1>
    <p class="mt-2 text-muted-foreground">
      This component hasn't been ported yet.
    </p>
    <NuxtLink to="/docs" class="mt-4 inline-block">
      <UiButton variant="outline">Back to docs</UiButton>
    </NuxtLink>
  </div>
</template>
