---
title: Fisheye Infinite Grid
description: A dense, draggable image wall that repeats forever on both axes and is bent by one continuous fisheye lens, with weighted momentum.
---

A WebGL image wall that tiles seamlessly in every direction and bends through one center-weighted fisheye lens. Drag to pan and release to let it coast, scroll with a wheel or trackpad, or focus it and use the arrow keys. A mouse entering the grid gives it a small drift away from the edge you came in from.

::demo-fisheye-infinite-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fisheye-infinite-grid.json"
```

## Usage

```vue
<script setup lang="ts">
  import FisheyeInfiniteGrid from '~/components/ui/fisheye-infinite-grid/FisheyeInfiniteGrid.vue';
  import type { FisheyeGridItem } from '~/components/ui/fisheye-infinite-grid/types';

  const items: FisheyeGridItem[] = [
    {
      image:
        'https://images.unsplash.com/photo-1514906689926-25ba6dcb584b?w=900',
      alt: 'Soft motion-blurred portrait in pale light',
      title: 'Silver Veil',
      meta: '01',
    },
    // …
  ];
</script>

<template>
  <div class="relative h-155 w-full overflow-hidden">
    <FisheyeInfiniteGrid
      :items="items"
      :tile-width="238"
      :tile-height="272"
      :lens-strength="0.24"
      theme="system"
    />
  </div>
</template>
```

All tiles are painted once into a 2D atlas canvas, which a single full-screen
fragment shader samples with `fract()` so the wall never ends. The lens warp,
edge shading and pan offset all happen in that one draw call. Images load with
`crossOrigin="anonymous"`, so their host must send CORS headers.

## Props

| Prop                | Type                            | Default                           | Description                                                                  |
| ------------------- | ------------------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| `items`             | `FisheyeGridItem[]`             | 12 editorial motion photos        | Images and labels repeated across the grid. An empty array uses the default. |
| `tile-width`        | `number`                        | `238`                             | Width of each tile in CSS pixels (minimum 140).                              |
| `tile-height`       | `number`                        | `272`                             | Height of each tile in CSS pixels (minimum 150).                             |
| `gap`               | `number`                        | `0`                               | Space between tiles in CSS pixels.                                           |
| `lens-strength`     | `number`                        | `0.24`                            | Strength of the center-weighted bend, clamped to 0–2.5. `0` is a flat grid.  |
| `theme`             | `'dark' \| 'light' \| 'system'` | `'system'`                        | Surface, tile chrome and vignette colors. `system` follows the page theme.   |
| `hover-nudge`       | `number`                        | `16`                              | Distance of the drift shown when a mouse enters the grid. `0` disables it.   |
| `inertia`           | `number`                        | `0.94`                            | Momentum kept after a drag release, clamped to 0–0.98.                       |
| `wheel-sensitivity` | `number`                        | `0.42`                            | Wheel and trackpad response. Lower values give a slower, heavier pan.        |
| `aria-label`        | `string`                        | `'Infinite draggable image grid'` | Accessible name of the grid region.                                          |
| `class`             | `string`                        | —                                 | Extra classes merged onto the root element.                                  |

### `FisheyeGridItem`

| Field   | Type     | Description                                    |
| ------- | -------- | ---------------------------------------------- |
| `image` | `string` | Image URL drawn inside the tile.               |
| `alt`   | `string` | Image description. Used as the label fallback. |
| `title` | `string` | Optional primary label, shown in upper case.   |
| `meta`  | `string` | Optional secondary label, right-aligned.       |

## Accessibility

- The root is a focusable `region` with a visible inset focus ring. Arrow keys pan the grid by 42px per press.
- A screen-reader-only hint explains the drag and arrow-key controls. The canvas itself is `aria-hidden`.
- With `prefers-reduced-motion: reduce`, the hover drift, release momentum and wheel coasting are off. Drag and arrow keys still move the grid directly.
- The render loop sleeps when the grid is still and pauses while it is offscreen.

- Ported from [componentry.fun](https://componentry.dev/docs/components/fisheye-infinite-grid) by Harsh Jadhav.
