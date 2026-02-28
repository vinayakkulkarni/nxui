<script setup lang="ts">
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'nxui',
          url: 'https://nxui.geoql.in',
          description:
            'Beautiful animated components for Vue. Built with Tailwind CSS and motion-v.',
          author: {
            '@type': 'Person',
            name: 'Vinayak Kulkarni',
            url: 'https://vinayakkulkarni.dev',
          },
        }),
      },
    ],
  });
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
