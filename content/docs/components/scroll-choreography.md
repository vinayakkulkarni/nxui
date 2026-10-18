---
title: Scroll Choreography
description: Scroll-driven image choreography with diagonal movement, stacking, and hero expansion phases.
---

::demo-scroll-choreography
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-choreography.json"
```

## Usage

```vue
<script setup lang="ts">
  import ScrollChoreography from '~/components/ui/scroll-choreography/ScrollChoreography.vue';
</script>

<template>
  <ScrollChoreography
    :images="{
      topLeft:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      topRight:
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      bottomLeft:
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      bottomRight:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    }"
  />
</template>
```

## Props

| Prop     | Type                                                                             | Default | Description                            |
| -------- | -------------------------------------------------------------------------------- | ------- | -------------------------------------- |
| `images` | `{ topLeft: string; topRight: string; bottomLeft: string; bottomRight: string }` | —       | URLs for the four choreographed images |
| `class`  | `string`                                                                         | —       | Additional CSS classes                 |
