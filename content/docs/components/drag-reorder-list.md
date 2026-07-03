---
title: Drag Reorder List
description: Drag-to-reorder list with lift, tilt, shadow, and an empty-space cutout showing where the item will land.
---

::demo-drag-reorder-list
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/drag-reorder-list.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import DragReorderList from '~/components/ui/drag-reorder-list/DragReorderList.vue';

  const items = ref(['One', 'Two', 'Three']);
</script>

<template>
  <DragReorderList v-model="items" :item-height="56" :gap="8" />
</template>
```

Each row renders the item string by default. Use the default slot for custom row content:

```vue
<DragReorderList v-model="items">
  <template #default="{ item, index }">
    <span class="text-sm">{{ index + 1 }}. {{ item }}</span>
  </template>
</DragReorderList>
```

## Props

| Prop          | Type       | Default | Description                                          |
| ------------- | ---------- | ------- | ---------------------------------------------------- |
| `model-value` | `string[]` | —       | Items to render (v-model). Emits the reordered array |
| `item-height` | `number`   | `56`    | Fixed row height in px                               |
| `gap`         | `number`   | `8`     | Vertical gap between rows in px                      |
| `show-handle` | `boolean`  | `true`  | Show the grip handle. When `false` whole row drags   |
| `lift-scale`  | `number`   | `1.04`  | Scale applied to the lifted row                      |
| `max-tilt`    | `number`   | `3`     | Max rotation (deg) from drag velocity                |
| `stiffness`   | `number`   | `500`   | Spring stiffness for settle/shift animations         |
| `damping`     | `number`   | `38`    | Spring damping for settle/shift animations           |
