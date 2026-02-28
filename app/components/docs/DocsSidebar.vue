<script setup lang="ts">
  import { docsNav } from '~/config/docs';

  const route = useRoute();

  const activeHrefByGroup = computed(() => {
    const result: Record<string, string | null> = {};
    for (const group of docsNav) {
      const activeItem = group.items.find((item) => route.path === item.path);
      result[group.title] = activeItem?.path ?? null;
    }
    return result;
  });
</script>

<template>
  <aside
    class="hidden w-64 shrink-0 border-r border-border/30 md:block dark:border-white/6"
  >
    <div
      class="sticky top-16 h-[calc(100svh-4rem)] overflow-y-auto px-3 py-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50"
    >
      <nav class="space-y-5">
        <DocsSidebarGroup
          v-for="group in docsNav"
          :key="group.title"
          :title="group.title"
          :items="group.items"
          :active-href="activeHrefByGroup[group.title] ?? null"
        />
      </nav>

      <div class="mt-8 border-t border-border/30 pt-6 dark:border-white/6">
        <p
          class="px-3 text-[10px] uppercase tracking-widest text-muted-foreground/40"
        >
          More components soon
        </p>
      </div>
    </div>
  </aside>
</template>
