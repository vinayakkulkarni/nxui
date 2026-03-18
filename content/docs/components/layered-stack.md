---
title: Layered Stack
description: Stack of cards that fans out on hover, stacking back with random rotation on mouse leave.
---

::demo-layered-stack
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/layered-stack.json"
```

## Props

| Prop    | Type     | Default | Description            |
| ------- | -------- | ------- | ---------------------- |
| `class` | `string` | —       | Additional CSS classes |

## Usage

Wrap any child elements — they will be stacked into a pile on mount and fan out to their natural positions on hover.

```vue
<script setup lang="ts">
  import LayeredStack from '~/components/ui/LayeredStack.vue';
</script>

<template>
  <LayeredStack class="grid grid-cols-3 gap-4 p-8">
    <div class="size-24 rounded-xl bg-linear-to-br from-rose-400 to-pink-600" />
    <div class="size-24 rounded-xl bg-linear-to-br from-amber-400 to-orange-600" />
    <div class="size-24 rounded-xl bg-linear-to-br from-emerald-400 to-green-600" />
    <div class="size-24 rounded-xl bg-linear-to-br from-sky-400 to-blue-600" />
    <div class="size-24 rounded-xl bg-linear-to-br from-violet-400 to-purple-600" />
    <div class="size-24 rounded-xl bg-linear-to-br from-fuchsia-400 to-pink-600" />
  </LayeredStack>
</template>
```
