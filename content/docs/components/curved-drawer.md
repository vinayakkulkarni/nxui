---
title: Curved Drawer
description: Slide-in drawer whose inner edge bulges with velocity via SVG path morphing, settling straight at rest.
---

::demo-curved-drawer
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/curved-drawer.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import CurvedDrawer from '~/components/ui/curved-drawer/CurvedDrawer.vue';

  const open = ref(false);
</script>

<template>
  <div class="relative overflow-hidden">
    <button @click="open = !open">Open drawer</button>

    <CurvedDrawer v-model="open" side="right" :width="320">
      <div class="p-6">Drawer content</div>
    </CurvedDrawer>
  </div>
</template>
```

The drawer is positioned absolutely inside its nearest relative ancestor.
A custom spring integrator drives the slide, and its velocity feeds an SVG
quadratic path on the inner edge — the faster the panel moves, the deeper
the bulge; when the spring settles the edge flattens back to a straight
line.

## Props

| Prop         | Type                | Default             | Description                           |
| ------------ | ------------------- | ------------------- | ------------------------------------- |
| `v-model`    | `boolean`           | `false`             | Open state                            |
| `side`       | `'left' \| 'right'` | `'right'`           | Edge the drawer slides from           |
| `width`      | `number`            | `380`               | Panel width in px                     |
| `max-bulge`  | `number`            | `48`                | Maximum curve depth in px             |
| `stiffness`  | `number`            | `170`               | Spring stiffness                      |
| `damping`    | `number`            | `22`                | Spring damping                        |
| `overlay`    | `boolean`           | `true`              | Dimming backdrop that closes on click |
| `background` | `string`            | `var(--background)` | Panel + curve fill color              |
