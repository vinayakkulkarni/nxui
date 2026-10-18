---
title: Collection Surfer
description: A 3D scroll-driven collection viewer where items surf along a perspective track. Perfect for immersive showcases.
---

::demo-collection-surfer
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/collection-surfer.json"
```

## Usage

```vue
<script setup lang="ts">
  import CollectionSurfer from '~/components/ui/collection-surfer/CollectionSurfer.vue';
  import type { CollectionSurferItem } from '~/types/components';

  const items: CollectionSurferItem[] = [
    {
      id: 1,
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
      title: 'HERITAGE 01',
    },
    {
      id: 2,
      image:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
      title: 'HERITAGE 02',
    },
    // ...
  ];
</script>

<template>
  <CollectionSurfer :items="items" variant="magnetic" class="h-150" />
</template>
```

## Props

| Prop      | Type                                 | Default      | Description                                                                                       |
| --------- | ------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------- |
| `items`   | `CollectionSurferItem[]`             | `[]`         | Array of items with id, image URL, and title                                                      |
| `variant` | `'magnetic' \| 'uplift' \| 'simple'` | `'magnetic'` | Interaction style. Magnetic scales on hover, uplift moves vertically, simple has no hover effects |
| `class`   | `string`                             | `''`         | Additional CSS classes                                                                            |
