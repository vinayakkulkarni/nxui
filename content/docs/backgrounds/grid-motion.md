---
title: Grid Motion
description: A tilted wall of drifting tiles that slides with the pointer and lights up where it rests.
---

A rotated wall of photo or text tiles fills its container and drifts row by row. Moving the pointer across the page slides the rows against each other, and the tiles under the pointer come back to full brightness (and full color in grayscale mode) while the rest stay dimmed.

::demo-grid-motion
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/grid-motion.json"
```

## Usage

```vue
<script setup lang="ts">
  import GridMotion from '~/components/ui/grid-motion/GridMotion.vue';
  import type { GridMotionItem } from '~/components/ui/grid-motion/types';

  const items: GridMotionItem[] = [
    'https://images.unsplash.com/photo-1705032033999-efa3082e1a4e?w=640',
    'Motion',
    { src: '/work/poster.jpg', alt: 'Poster' },
  ];
</script>

<template>
  <div class="relative h-125 w-full">
    <GridMotion
      :items="items"
      :rows="4"
      :angle="-12"
      :tilt="0"
      :speed="24"
      direction="alternate"
      :spotlight="0.6"
      :dim="0.35"
      theme="dark"
    />
  </div>
</template>
```

The wall sizes itself from its container, so give the parent a height. Rows move with `transform` only and the spotlight writes one `--spot` custom property per tile, so there is no re-render while it animates. The loop pauses when the wall is offscreen.

## Props

| Prop           | Type                                                               | Default       | Description                                                                                               |
| -------------- | ------------------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------- |
| `items`        | `Array<string \| number \| { src: string; alt?: string } \| null>` | `[]`          | Tile content. Image URLs and paths render as photos, other values as text. Items repeat to fill the wall. |
| `rows`         | `number`                                                           | `4`           | Rows of tiles (1–12). More rows means smaller tiles.                                                      |
| `aspect-ratio` | `number`                                                           | `1.33`        | Width of each tile divided by its height. Below 1 gives portrait tiles.                                   |
| `gap`          | `number`                                                           | `16`          | Space between tiles in pixels.                                                                            |
| `radius`       | `number`                                                           | `14`          | Corner radius of the tiles in pixels. Large values give pills.                                            |
| `angle`        | `number`                                                           | `-12`         | Rotation of the whole wall in degrees.                                                                    |
| `tilt`         | `number`                                                           | `0`           | Leans the wall back in 3D, in degrees (0–75). 0 keeps it flat.                                            |
| `speed`        | `number`                                                           | `24`          | Drift speed of the rows in pixels per second. 0 keeps them still.                                         |
| `direction`    | `'alternate' \| 'left' \| 'right'`                                 | `'alternate'` | Which way the rows drift. Alternate sends neighbouring rows in opposite directions.                       |
| `parallax`     | `number`                                                           | `0.5`         | How far the rows slide against each other as the pointer moves across the page, from 0 to 1.              |
| `spotlight`    | `number`                                                           | `0.6`         | Size of the area around the pointer where tiles come back to full color, from 0 to 1. 0 turns it off.     |
| `dim`          | `number`                                                           | `0.35`        | Fades the tiles outside the spotlight, which keeps text on top readable. From 0 to 1.                     |
| `grayscale`    | `boolean`                                                          | `false`       | Shows the tiles in grayscale until the spotlight brings their color back.                                 |
| `fade`         | `number`                                                           | `0.5`         | Fades the edges of the wall into the page, from 0 to 1.                                                   |
| `tile-color`   | `string`                                                           | theme         | Background of text and empty tiles.                                                                       |
| `text-color`   | `string`                                                           | theme         | Color of text tiles.                                                                                      |
| `theme`        | `'dark' \| 'light'`                                                | `'dark'`      | Picks the default tile and text colors.                                                                   |
| `class`        | `string`                                                           | `''`          | Extra classes for the root.                                                                               |

## Slots

| Slot   | Props                      | Description                                                                                             |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `tile` | `{ tile: GridMotionTile }` | Custom tile content. `tile.item` is the original item, `tile.kind` is `'image'`, `'text'` or `'empty'`. |

## Accessibility

- The wall is decorative and marked `aria-hidden`. Put real content above it.
- With `prefers-reduced-motion: reduce`, the rows stop drifting and the parallax is off; the spotlight still follows the pointer.
- Pointer input is read on the window, so content layered over the wall keeps its own clicks.

- Ported from [React Bits](https://reactbits.dev/backgrounds/grid-motion) by David Haz.
