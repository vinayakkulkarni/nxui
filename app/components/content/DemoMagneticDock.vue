<script setup lang="ts">
import MagneticDock from '@registry/new-york/MagneticDock/MagneticDock.vue';
import type { DockItem } from '~/types/components';

const items: DockItem[] = [
  { icon: 'lucide:home', label: 'Home' },
  { icon: 'lucide:search', label: 'Search' },
  { icon: 'lucide:mail', label: 'Mail' },
  { icon: 'lucide:calendar', label: 'Calendar' },
  { icon: 'lucide:settings', label: 'Settings' },
  { icon: 'lucide:music', label: 'Music' },
];
</script>

<template>
  <ComponentDemo>
    <MagneticDock :items="items" />
  </ComponentDemo>
</template>
