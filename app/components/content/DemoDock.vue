<script setup lang="ts">
  import Dock from '@registry/new-york/dock/Dock.vue';
  import type { DockItemData } from '~/types/components';

  const items: DockItemData[] = [
    { icon: 'lucide:house', label: 'Home' },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:music', label: 'Music' },
    { icon: 'lucide:heart', label: 'Favorites' },
    { icon: 'lucide:settings', label: 'Settings' },
  ];

  const code = `\x3Cscript setup lang="ts">
  import Dock from '~/components/ui/Dock/Dock.vue';
  import type { DockItemData } from '~/types/components';

  const items: DockItemData[] = [
    { icon: 'lucide:house', label: 'Home' },
    { icon: 'lucide:search', label: 'Search' },
    { icon: 'lucide:music', label: 'Music' },
    { icon: 'lucide:heart', label: 'Favorites' },
    { icon: 'lucide:settings', label: 'Settings' },
  ];
\x3C/script>

\x3Ctemplate>
  \x3Cdiv class="relative flex h-50 w-full items-end justify-center overflow-hidden rounded-lg">
    \x3CDock :items="items" />
  \x3C/div>
\x3C/template>`;
</script>

<template>
  <ComponentDemo :code="code" full-width>
    <div
      class="relative flex h-50 w-full items-end justify-center overflow-hidden rounded-lg"
    >
      <Dock :items="items" />
    </div>
  </ComponentDemo>
</template>
