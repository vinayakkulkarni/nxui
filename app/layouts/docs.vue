<script setup lang="ts">
  // Pages set `wide: true` in definePageMeta (the /docs gallery) to drop the
  // table of contents and use the full width for the component grid.
  const route = useRoute();
  const wide = computed(() => route.meta.wide === true);
</script>

<template>
  <div class="relative min-h-svh flex flex-col bg-background">
    <!-- Subtle gradient overlay for depth -->
    <div
      class="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-violet-500/3 via-transparent to-transparent dark:from-violet-500/6"
    ></div>
    <DocsHeader />
    <div class="relative z-10 flex flex-1">
      <DocsSidebar />
      <main class="min-w-0 flex-1 w-full">
        <div
          :class="[
            'mx-auto px-6 md:px-8 py-10 md:py-16',
            wide ? 'max-w-7xl' : 'max-w-4xl',
          ]"
        >
          <slot></slot>
        </div>
      </main>
      <DocsTableOfContents v-if="!wide" />
    </div>
  </div>
</template>
