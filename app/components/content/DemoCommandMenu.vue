<script setup lang="ts">
  import CommandMenu from '@registry/new-york/CommandMenu/CommandMenu.vue';
  import type { CommandItem } from '~/types/components';

  const open = ref(false);
  const items: CommandItem[] = [
    { label: 'Home', icon: 'lucide:home', group: 'Pages' },
    { label: 'About', icon: 'lucide:file-text', group: 'Pages' },
    { label: 'Documentation', icon: 'lucide:book-open', group: 'Pages' },
    { label: 'Profile', icon: 'lucide:user', group: 'Settings' },
    { label: 'Settings', icon: 'lucide:settings', group: 'Settings' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import CommandMenu from '~/components/ui/CommandMenu.vue';

  const open = ref(false);
  const items = [
    { label: 'Home', icon: 'lucide:home', group: 'Pages' },
    { label: 'About', icon: 'lucide:file-text', group: 'Pages' },
    { label: 'Profile', icon: 'lucide:user', group: 'Settings' },
    { label: 'Settings', icon: 'lucide:settings', group: 'Settings' },
  ];
</script>

<template>
  <button @click=&quot;open = true&quot;>Open Command Menu</button>
  <CommandMenu v-model:open=&quot;open&quot; :items=&quot;items&quot; />
</template>`"
  >
    <div class="flex size-full items-center justify-center">
      <button
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        @click="open = true"
      >
        Open Command Menu (⌘K)
      </button>
      <CommandMenu v-model:open="open" :items="items" />
    </div>
  </ComponentDemo>
</template>
