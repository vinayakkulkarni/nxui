<script setup lang="ts">
import CollectionSurfer from '@registry/new-york/CollectionSurfer/CollectionSurfer.vue';
import type { CollectionItem } from '~/types/components';

const items: CollectionItem[] = [
  {
    id: '1',
    title: 'Mountain Escape',
    description: 'A serene mountain landscape',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: '2',
    title: 'Ocean Breeze',
    description: 'Calm ocean waves at sunset',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: '3',
    title: 'Forest Trail',
    description: 'Deep forest hiking trail',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: '4',
    title: 'Desert Dunes',
    description: 'Golden sand dunes at dawn',
    color: 'linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)',
  },
];
</script>

<template>
  <ComponentDemo class="p-0">
    <CollectionSurfer :items="items" class="h-[350px] w-full" />
  </ComponentDemo>
</template>
