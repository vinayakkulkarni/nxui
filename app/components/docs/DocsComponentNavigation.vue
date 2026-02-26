<script setup lang="ts">
  import type { NavItem } from '~/types/docs';

  defineProps<{
    prev: NavItem | null;
    next: NavItem | null;
  }>();

  const route = useRoute();

  const editUrl = computed(() => {
    const slug = route.path.split('/').pop();
    const category = route.path.split('/')[2];
    return `https://github.com/vinayakkulkarni/nxui/edit/main/content/docs/${category}/${slug}.md`;
  });

  const issueUrl =
    'https://github.com/vinayakkulkarni/nxui/issues/new?labels=bug';
</script>

<template>
  <div>
    <!-- Edit & Report Links -->
    <div class="flex items-center justify-center gap-2 text-sm">
      <div class="h-px flex-1 bg-border/50"></div>
      <a
        :href="editUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        <Icon name="lucide:pencil" class="size-3.5" />
        Edit
      </a>
      <a
        :href="issueUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        <Icon name="lucide:circle-dot" class="size-3.5" />
        Report
      </a>
      <div class="h-px flex-1 bg-border/50"></div>
    </div>

    <!-- Prev/Next Navigation -->
    <div class="mt-4 grid grid-cols-2 gap-4">
      <NuxtLink
        v-if="prev"
        :to="prev.path"
        :aria-label="`Previous: ${prev.title}`"
        class="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5"
      >
        <div
          class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <div
            class="absolute -inset-px rounded-xl bg-linear-to-b from-primary/10 via-transparent to-transparent"
          ></div>
        </div>
        <div class="relative mb-3 flex items-center gap-2">
          <Icon
            name="lucide:arrow-left"
            class="size-4 text-muted-foreground transition-all duration-300 group-hover:-translate-x-1 group-hover:text-primary"
          />
          <span class="text-xs text-muted-foreground">Previous</span>
        </div>
        <div class="relative flex items-center gap-3">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/50 transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/10"
          >
            <Icon
              name="lucide:component"
              class="size-4 text-muted-foreground transition-colors duration-300 group-hover:text-primary"
            />
          </div>
          <span
            class="font-medium transition-colors duration-300 group-hover:text-primary"
          >
            {{ prev.title }}
          </span>
        </div>
      </NuxtLink>
      <div v-else></div>

      <NuxtLink
        v-if="next"
        :to="next.path"
        :aria-label="`Next: ${next.title}`"
        class="group relative flex flex-col items-end overflow-hidden rounded-xl border border-border/50 bg-card/50 p-5 text-right backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5"
      >
        <div
          class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <div
            class="absolute -inset-px rounded-xl bg-linear-to-b from-primary/10 via-transparent to-transparent"
          ></div>
        </div>
        <div class="relative mb-3 flex items-center gap-2">
          <span class="text-xs text-muted-foreground">Next</span>
          <Icon
            name="lucide:arrow-right"
            class="size-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
          />
        </div>
        <div class="relative flex items-center gap-3">
          <span
            class="font-medium transition-colors duration-300 group-hover:text-primary"
          >
            {{ next.title }}
          </span>
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/50 transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/10"
          >
            <Icon
              name="lucide:component"
              class="size-4 text-muted-foreground transition-colors duration-300 group-hover:text-primary"
            />
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
