<script setup lang="ts">
  useHead({
    titleTemplate: (title?: string) =>
      title && title.includes('nxui')
        ? title
        : title
          ? `${title} · nxui`
          : 'nxui — Animated Vue Components',
  });
  useSchemaOrg([
    defineOrganization({
      name: 'nxui',
      logo: '/apple-touch-icon.png',
      description:
        'nxui is an open-source library of animated, copy-paste UI components for Vue 3, built with Tailwind CSS and motion-v.',
      founder: definePerson({
        name: 'Vinayak Kulkarni',
        url: 'https://vinayakkulkarni.dev',
      }),
      sameAs: ['https://github.com/vinayakkulkarni/nxui'],
    }),
    defineWebSite({
      name: 'nxui',
      inLanguage: 'en-US',
    }),
  ]);
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
