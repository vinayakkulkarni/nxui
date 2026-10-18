---
title: Squares
description: Animated grid of squares with directional movement and hover interaction.
---

::demo-squares
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/squares.json"
```

## Usage

```vue
<script setup lang="ts">
  import Squares from '~/components/ui/squares/Squares.vue';
</script>

<template>
  <div class="relative h-100 w-full overflow-hidden rounded-lg">
    <Squares
      :speed="0.5"
      direction="diagonal"
      border-color="#333"
      hover-fill-color="#222"
      :square-size="40"
    />
  </div>
</template>
```

## Props

| Prop               | Type                                                | Default   | Description                   |
| ------------------ | --------------------------------------------------- | --------- | ----------------------------- |
| `direction`        | `'left' \| 'right' \| 'up' \| 'down' \| 'diagonal'` | `'right'` | Direction of grid movement    |
| `speed`            | `number`                                            | `1`       | Animation speed               |
| `border-color`     | `string`                                            | `'#999'`  | Border color of squares       |
| `square-size`      | `number`                                            | `40`      | Size of each square in pixels |
| `hover-fill-color` | `string`                                            | `'#222'`  | Fill color on hover           |
| `class`            | `string`                                            | —         | Additional CSS classes        |
