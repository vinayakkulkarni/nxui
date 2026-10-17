---
title: Grid Distortion
description: Image background that breaks into a grid of blocks under the cursor and settles back into place.
---

An image covers the container without stretching and breaks into a grid of blocks wherever the cursor moves. The blocks drift back into place on their own. Click to send a ring of displaced cells across the image. Modes range from crisp blocks to a liquid warp.

::demo-grid-distortion
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/grid-distortion.json"
```

## Usage

```vue
<script setup lang="ts">
  import GridDistortion from '~/components/ui/grid-distortion/GridDistortion.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <GridDistortion
      image-src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920"
      :grid="24"
      :strength="0.25"
      :relaxation="0.95"
      :softness="1"
    />
  </div>
</template>
```

The image is loaded with `crossOrigin="anonymous"`, so remote images must be
served with CORS headers.

## Props

| Prop           | Type                          | Default  | Description                                                                                     |
| -------------- | ----------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `image-src`    | `string`                      | —        | Image to distort. It covers the container.                                                      |
| `grid`         | `number`                      | `15`     | Number of cells across. Rows follow the container so cells stay square.                         |
| `radius`       | `number`                      | `0.18`   | Reach of the pointer as a fraction of the container width.                                      |
| `strength`     | `number`                      | `0.15`   | How far the pointer throws the cells. 0 turns the pointer off.                                  |
| `relaxation`   | `number`                      | `0.96`   | How much displacement each cell keeps per frame. Higher values settle more slowly.              |
| `mode`         | `'drag' \| 'push' \| 'swirl'` | `'drag'` | Drag pulls cells along with the pointer, push throws them outward and swirl spins them around.  |
| `softness`     | `number`                      | `0`      | Blends the crisp blocks into a smooth liquid warp, from 0 to 1.                                 |
| `chroma`       | `number`                      | `0`      | Splits the color channels on displaced cells, from 0 to 1.                                      |
| `idle`         | `number`                      | `0.3`    | A slow wandering distortion that keeps the image alive while the pointer rests. 0 turns it off. |
| `click-ripple` | `boolean`                     | `true`   | Sends a ring of displaced cells out from every click.                                           |
| `intro`        | `boolean`                     | `true`   | Scrambles the cells when the image loads and lets them settle into place.                       |
| `class`        | `string`                      | `''`     | Extra classes for the container.                                                                |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. If the image carries meaning, describe it in nearby text.
- With `prefers-reduced-motion: reduce`, the intro scramble, idle drift and click ripples are off. The image only moves when you move the cursor.
- The animation stops when the grid has settled and while the container is offscreen.

- Ported from [React Bits](https://reactbits.dev/backgrounds/grid-distortion) by David Haz.
