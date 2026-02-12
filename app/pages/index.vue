<script setup lang="ts">
  useHead({
    title: 'nxui - Animated Vue Components',
    meta: [
      {
        name: 'description',
        content:
          'Beautiful animated components for Vue. Built with Tailwind CSS and motion-v. Copy, paste, and ship.',
      },
    ],
  });
</script>

<template>
  <div class="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
    <div class="mx-auto max-w-3xl text-center">
      <UiBadge variant="secondary" class="mb-4">
        Open Source · 26+ Components
      </UiBadge>
      <h1 class="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        Components for
        <br />
        Perfectionists.
      </h1>
      <p class="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
        Beautifully crafted Vue components you can copy and paste into your
        apps. Accessible. Customizable. Open Source.
      </p>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <NuxtLink to="/docs">
          <UiButton size="lg">Browse Components</UiButton>
        </NuxtLink>
        <a
          href="https://github.com/vinayakkulkarni/nxui"
          target="_blank"
          rel="noopener noreferrer"
        >
          <UiButton variant="outline" size="lg">
            <Icon name="simple-icons:github" class="mr-2 size-4" />
            Star on GitHub
          </UiButton>
        </a>
      </div>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-2">
        <UiBadge variant="outline">Vue 3</UiBadge>
        <UiBadge variant="outline">Nuxt</UiBadge>
        <UiBadge variant="outline">Tailwind CSS</UiBadge>
        <UiBadge variant="outline">motion-v</UiBadge>
      </div>
    </div>
  </div>
</template>
