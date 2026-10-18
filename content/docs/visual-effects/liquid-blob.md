---
title: Liquid Blob
description: A morphing liquid blob animation that follows the cursor with spring physics.
---

::demo-liquid-blob
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/liquid-blob.json"
```

## Usage

```vue
<script setup lang="ts">
  import LiquidBlob from '~/components/ui/liquid-blob/LiquidBlob.vue';
</script>

<template>
  <LiquidBlob class="h-75 w-full rounded-xl bg-neutral-100 dark:bg-zinc-900" />
</template>
```

## Props

| Prop     | Type     | Default     | Description                              |
| -------- | -------- | ----------- | ---------------------------------------- |
| `color1` | `string` | `'#7c3aed'` | Primary color of the blob                |
| `color2` | `string` | `'#06b6d4'` | Secondary color of the blob              |
| `size`   | `number` | `300`       | Size of the blob in pixels               |
| `speed`  | `number` | `1`         | Animation speed multiplier               |
| `class`  | `string` | —           | Additional CSS classes for the container |
