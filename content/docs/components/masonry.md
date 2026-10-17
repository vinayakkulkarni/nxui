---
title: Masonry
description: A masonry gallery that springs into place, reflows as it resizes, reorders by drag and opens images in a lightbox.
---

A masonry gallery whose tiles spring into place as they scroll into view, sharpening from a blur. Columns follow the container width and every tile keeps its image's shape. Hover a tile to zoom, lift or tilt it, drag a tile with the mouse to reorder the grid, and click it to open a lightbox you can step through with the arrow keys.

::demo-masonry
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/masonry.json"
```

## Usage

```vue
<script setup lang="ts">
  import Masonry from '~/components/ui/masonry/Masonry.vue';
  import type { MasonryItem } from '~/components/ui/masonry';

  const items: MasonryItem[] = [
    {
      id: '1015',
      img: 'https://picsum.photos/id/1015/600/900?grayscale',
      width: 600,
      height: 900,
      title: 'Alexey Topolyanskiy',
      url: 'https://unsplash.com/photos/-oWyJoSqBRM',
    },
    {
      id: '1011',
      img: 'https://picsum.photos/id/1011/600/750?grayscale',
      width: 600,
      height: 750,
      title: 'Roberto Nickson',
    },
  ];
</script>

<template>
  <Masonry
    :items="items"
    :column-width="240"
    :gap="12"
    animate-from="bottom"
    hover-effect="zoom"
    captions="hover"
    @reorder="(next) => console.log(next)"
  />
</template>
```

Give each item a `width` and `height` to lay it out at once; otherwise the image is measured first. Every tile rides a damped spring, so a resize, a column change or a drag makes the whole grid glide to its new places instead of jumping. Removed items fade out where they stood.

## Props

| Prop               | Type                                                                       | Default    | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `items`            | `MasonryItem[]`                                                            | `[]`       | Tiles to show (see below).                                                             |
| `columns`          | `'auto' \| number`                                                         | `'auto'`   | Column count. `'auto'` fits as many columns of `column-width` as the container allows. |
| `column-width`     | `number`                                                                   | `240`      | Target column width in px for auto columns.                                            |
| `gap`              | `number`                                                                   | `12`       | Space between tiles in px.                                                             |
| `radius`           | `number`                                                                   | `12`       | Corner radius of the tiles in px.                                                      |
| `animate-from`     | `'bottom' \| 'top' \| 'left' \| 'right' \| 'center' \| 'random' \| 'none'` | `'bottom'` | Where tiles come from as they appear.                                                  |
| `stagger`          | `number`                                                                   | `0.05`     | Delay in seconds between tiles appearing.                                              |
| `duration`         | `number`                                                                   | `0.6`      | Length in seconds of the springs that move tiles in and between places.                |
| `bounce`           | `number`                                                                   | `0.15`     | How much the tiles overshoot as they settle, from 0 to 0.9.                            |
| `blur-to-focus`    | `boolean`                                                                  | `true`     | Tiles sharpen from a blur as they appear.                                              |
| `reveal-on-scroll` | `boolean`                                                                  | `true`     | Tiles appear as they scroll into view instead of all at once.                          |
| `hover-effect`     | `'zoom' \| 'lift' \| 'tilt' \| 'none'`                                     | `'zoom'`   | Zoom the image, lift the tile, or tilt it toward the cursor.                           |
| `focus-on-hover`   | `boolean`                                                                  | `false`    | Fades the other tiles while one is hovered.                                            |
| `captions`         | `'hover' \| 'always' \| 'none'`                                            | `'hover'`  | When the title and description show over a tile.                                       |
| `parallax`         | `number`                                                                   | `0`        | How far images drift inside their tiles as the page scrolls, from 0 to 1.              |
| `lightbox`         | `boolean`                                                                  | `true`     | Clicking a tile opens it full size. Arrow keys step between images, Escape closes.     |
| `draggable`        | `boolean`                                                                  | `true`     | Drag tiles with a mouse to reorder them. The grid reflows around the tile as it moves. |
| `class`            | `string`                                                                   | `''`       | Extra classes for the grid.                                                            |

### MasonryItem

| Field         | Type               | Description                                                        |
| ------------- | ------------------ | ------------------------------------------------------------------ |
| `id`          | `string \| number` | Unique key.                                                        |
| `img`         | `string`           | Image URL.                                                         |
| `width`       | `number`           | Natural width. With `height`, skips measuring the image.           |
| `height`      | `number`           | Natural height.                                                    |
| `title`       | `string`           | Caption title, also the tile's accessible name.                    |
| `description` | `string`           | Caption text.                                                      |
| `alt`         | `string`           | Alt text (falls back to `title`).                                  |
| `url`         | `string`           | Link. Opens from the lightbox, or directly when `lightbox` is off. |
| `span`        | `number`           | Number of columns the tile covers.                                 |

## Events

| Event        | Payload                                                 | Description                                                                               |
| ------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `item-click` | `(item: MasonryItem, index: number, event: MouseEvent)` | Fired when a tile is clicked. Call `event.preventDefault()` to skip the lightbox or link. |
| `reorder`    | `(items: MasonryItem[])`                                | Fired with the new order after a drag.                                                    |

## Accessibility

- The grid is a `role="list"` of `listitem` tiles. Tiles are real `<button>` elements while the lightbox or an `item-click` handler is active, links when `lightbox` is off and the item has a `url`, and plain blocks otherwise.
- Keyboard focus shows an outline and reveals hover captions.
- The lightbox is a modal `role="dialog"`: focus moves to the close button, page scroll is locked, Escape closes, the arrow keys step through images, and focus returns to the tile on close.
- Drag to reorder is mouse-only, so touch scrolling never moves tiles.
- With `prefers-reduced-motion: reduce`, tiles appear in place without travel or blur, and reflows and the lightbox skip their animations.

- Ported from [React Bits](https://reactbits.dev/components/masonry) by David Haz.
