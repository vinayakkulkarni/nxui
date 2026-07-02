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

  const componentCount = useRuntimeConfig().public.componentCount;

  const faqs = [
    {
      q: 'Is nxui free?',
      a: 'Yes. nxui is open source and free forever under the MIT license. You can use every component in personal and commercial projects at no cost.',
    },
    {
      q: 'How do I install an nxui component?',
      a: 'Run the shadcn-vue CLI with the component URL, e.g. `npx shadcn-vue@latest add "https://nxui.geoql.in/r/hyper-text.json"`. The source is copied into your project — you own the code, with no runtime dependency on nxui.',
    },
    {
      q: 'What is nxui built with?',
      a: `nxui is built with Vue 3 (Composition API and \`<script setup>\`), Nuxt 4, Tailwind CSS v4, and motion-v (the Vue port of Framer Motion). It ships ${componentCount}+ animated, copy-paste components.`,
    },
    {
      q: 'Does nxui work with Nuxt?',
      a: 'Yes. nxui components are standard Vue 3 single-file components and work in any Vue 3 or Nuxt 4 project. Every component supports dark mode out of the box.',
    },
    {
      q: 'Can I copy the source instead of using the CLI?',
      a: 'Yes. Every component has a live demo and its full source on the docs site, so you can copy and paste the code directly without the CLI.',
    },
  ];

  const installSteps = [
    {
      name: 'Pick a component',
      text: 'Browse the nxui docs and choose a component. Each page has a live demo and the full source.',
    },
    {
      name: 'Run the shadcn-vue CLI',
      text: 'Run `npx shadcn-vue@latest add "https://nxui.geoql.in/r/<component>.json"` to copy the component source into your project.',
    },
    {
      name: 'Import and use it',
      text: 'Import the component from your local components directory and drop it into your template. No runtime dependency on nxui — you own the code.',
    },
  ];

  useSchemaOrg([
    defineWebPage({
      '@type': ['CollectionPage', 'FAQPage'],
      name: page.value?.title,
      description: page.value?.description,
      mainEntity: faqs.map((f) =>
        defineQuestion({ name: f.q, acceptedAnswer: f.a }),
      ),
    }),
    defineHowTo({
      name: 'How to install an nxui component',
      description:
        'Add any nxui animated Vue component to your project with the shadcn-vue CLI.',
      step: installSteps.map((s) =>
        defineHowToStep({ name: s.name, text: s.text }),
      ),
    }),
  ]);
  const ogImageUrl = 'https://nxui.geoql.in/og.png';
  const brandTitle = `nxui — ${componentCount}+ Animated, Copy-Paste UI Components for Vue`;
  const brandDescription = `Beautiful animated components for Vue 3 & Nuxt. Built with Tailwind CSS and motion-v. ${componentCount}+ interactive, copy-paste components. Open source, MIT, free forever.`;
  useSeoMeta({
    title: brandTitle,
    description: brandDescription,
    ogTitle: brandTitle,
    ogDescription: brandDescription,
    ogType: 'website',
    ogUrl: 'https://nxui.geoql.in/docs',
    ogSiteName: 'nxui',
    ogImage: ogImageUrl,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    twitterSite: '@vinayakkulkarni',
    twitterTitle: brandTitle,
    twitterDescription: brandDescription,
    twitterImage: ogImageUrl,
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
      <p class="text-sm font-medium text-muted-foreground">
        {{ componentCount }}+ copy-paste components
      </p>
    </header>
    <ContentRenderer :value="page" />

    <section class="space-y-4">
      <h2 class="font-display text-2xl font-bold md:text-3xl">
        Frequently asked questions
      </h2>
      <details
        v-for="faq in faqs"
        :key="faq.q"
        class="group rounded-lg border border-border bg-card p-4"
      >
        <summary
          class="cursor-pointer list-none font-medium text-foreground marker:content-none"
        >
          {{ faq.q }}
        </summary>
        <p class="mt-2 text-sm/relaxed text-muted-foreground">{{ faq.a }}</p>
      </details>
    </section>
  </div>
</template>
