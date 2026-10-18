---
title: Dither Gradient
description: A dithered gradient effect rendered on canvas with customizable colors and animation.
---

::demo-dither-gradient
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dither-gradient.json"
```

## Usage

```vue
<script setup lang="ts">
  import DitherGradient from '~/components/ui/dither-gradient/DitherGradient.vue';
</script>

<template>
  <DitherGradient class="h-75 w-full" />
</template>
```

## Props

| Prop         | Type     | Default     | Description                              |
| ------------ | -------- | ----------- | ---------------------------------------- |
| `color-from` | `string` | `'#7c3aed'` | Starting color of the gradient           |
| `color-to`   | `string` | `'#06b6d4'` | Ending color of the gradient             |
| `angle`      | `number` | `135`       | Angle of the gradient in degrees         |
| `class`      | `string` | —           | Additional CSS classes for the container |
