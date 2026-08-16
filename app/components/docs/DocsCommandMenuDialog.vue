<script setup lang="ts">
  import type { NavGroup, NavItem } from '~/types/docs';

  defineProps<{
    query: string;
    filteredGroups: NavGroup[];
    flatItems: NavItem[];
    selectedIndex: number;
    inputRef: HTMLInputElement | null;
  }>();

  const emit = defineEmits<{
    'update:query': [value: string];
    'update:input-ref': [el: HTMLInputElement | null];
    select: [path: string];
    keydown: [e: KeyboardEvent];
    close: [];
  }>();
</script>

<template>
  <div class="fixed left-1/2 top-1/2 z-101 w-full max-w-170 -translate-1/2 p-4">
    <div
      class="overflow-hidden rounded-2xl border border-border/80 bg-popover shadow-2xl shadow-black/10 dark:shadow-black/30 backdrop-blur-2xl dark:border-white/8"
      @keydown="emit('keydown', $event)"
    >
      <DocsCommandMenuInput
        :query="query"
        @update:query="emit('update:query', $event)"
        @update:input-ref="emit('update:input-ref', $event)"
      />
      <DocsCommandMenuResults
        :filtered-groups="filteredGroups"
        :flat-items="flatItems"
        :selected-index="selectedIndex"
        @select="emit('select', $event)"
      />
      <DocsCommandMenuFooter />
    </div>
  </div>
</template>
