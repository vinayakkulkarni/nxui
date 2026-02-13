<script setup lang="ts">
  import CommandMenu from '@registry/new-york/CommandMenu/CommandMenu.vue';
  import type { CommandItem } from '~/types/components';

  const open = ref(false);
  const items: CommandItem[] = [
    { label: 'Home', icon: 'lucide:home', shortcut: '⌘H', group: 'Navigation' },
    { label: 'Settings', icon: 'lucide:settings', shortcut: '⌘,', group: 'Navigation' },
    { label: 'Search', icon: 'lucide:search', shortcut: '⌘F', group: 'Actions' },
    { label: 'New File', icon: 'lucide:file-plus', shortcut: '⌘N', group: 'Actions' },
    { label: 'Dark Mode', icon: 'lucide:moon', group: 'Preferences' },
  ];
</script>

<template>
  <ComponentDemo>
    <button
      class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      @click="open = true"
    >
      Open Command Menu (⌘K)
    </button>
    <CommandMenu v-model:open="open" :items="items" />
  </ComponentDemo>
</template>
