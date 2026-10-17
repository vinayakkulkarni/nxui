---
title: Flowing Menu
description: A full-height menu with one liquid band that glides and stretches between rows and reveals a scrolling marquee of each item.
---

A full-height menu where one band follows your cursor from row to row. Its two edges are springs of different stiffness, so the band stretches like liquid on the way and leans toward the cursor inside a row. Under the band each row shows a marquee of its text and image; moving the cursor sideways speeds the marquee up or reverses it. On mount the rows rise in, the lines draw and the band sweeps once down the menu. Tab through the rows to move the band with the keyboard.

::demo-flowing-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flowing-menu.json"
```

## Usage

```vue
<script setup lang="ts">
  import FlowingMenu from '~/components/ui/flowing-menu/FlowingMenu.vue';
  import type { FlowingMenuItem } from '~/components/ui/flowing-menu/types';

  const items: FlowingMenuItem[] = [
    {
      link: '#',
      text: 'Mojave',
      meta: '2018',
      image: 'https://picsum.photos/600/400?random=1',
    },
    {
      link: '#',
      text: 'Sonoma',
      meta: '2023',
      image: 'https://picsum.photos/600/400?random=2',
    },
    {
      link: '#',
      text: 'Monterey',
      meta: '2021',
      image: 'https://picsum.photos/600/400?random=3',
    },
    {
      link: '#',
      text: 'Sequoia',
      meta: '2024',
      image: 'https://picsum.photos/600/400?random=4',
    },
  ];

  function onItemClick(item: FlowingMenuItem, index: number) {
    console.log(index, item.text);
  }
</script>

<template>
  <div class="relative h-150 w-full">
    <FlowingMenu
      :items="items"
      :band-inset="12"
      :band-radius="999"
      carry-content
      image-shape="circle"
      dim-inactive
      :dividers="false"
      marquee-bg-color="#ff6a3d"
      @item-click="onItemClick"
    />
  </div>
</template>
```

The menu fills its parent's height and splits it evenly between rows, so give the parent a height.

## Props

| Prop                 | Type                               | Default                       | Description                                                                  |
| -------------------- | ---------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `items`              | `FlowingMenuItem[]`                | `[]`                          | Menu rows.                                                                   |
| `speed`              | `number`                           | `60`                          | Marquee speed in px per second.                                              |
| `direction`          | `'left' \| 'right' \| 'alternate'` | `'left'`                      | Which way the marquee runs. Alternate flips every other row.                 |
| `follow-cursor`      | `number`                           | `0.4`                         | How much moving the cursor sideways speeds up or reverses the marquee (0–1). |
| `duration`           | `number`                           | `0.5`                         | Time in seconds the band takes to glide to a row.                            |
| `stretch`            | `number`                           | `0.6`                         | How much the band stretches while it moves, from 0 (rigid) to 1.             |
| `magnet`             | `number`                           | `0.25`                        | How much the band leans toward the cursor inside a row (0–1).                |
| `band-inset`         | `number`                           | `0`                           | Gap in px between the band and the row edges.                                |
| `band-radius`        | `number`                           | `0`                           | Corner radius of the band in px. Use a large value for a capsule.            |
| `carry-content`      | `boolean`                          | `false`                       | Moves the marquee with the band instead of keeping it fixed in each row.     |
| `text-color`         | `string`                           | `'#ffffff'`                   | Color of the menu text.                                                      |
| `bg-color`           | `string`                           | `'#120F17'`                   | Background color of the menu.                                                |
| `marquee-bg-color`   | `string`                           | `'#ffffff'`                   | Background color of the band.                                                |
| `marquee-text-color` | `string`                           | `'#120F17'`                   | Text color inside the band.                                                  |
| `border-color`       | `string`                           | `'rgba(255, 255, 255, 0.14)'` | Color of the lines between rows.                                             |
| `dividers`           | `boolean`                          | `true`                        | Draws lines between rows.                                                    |
| `dim-inactive`       | `boolean`                          | `false`                       | Fades the other rows while the band is on one.                               |
| `align`              | `'center' \| 'left'`               | `'center'`                    | Alignment of the row labels.                                                 |
| `show-index`         | `boolean`                          | `false`                       | Numbers each row.                                                            |
| `show-arrow`         | `boolean`                          | `false`                       | Adds an arrow to the end of each row.                                        |
| `image-shape`        | `'pill' \| 'rounded' \| 'circle'`  | `'pill'`                      | Shape of the images in the band.                                             |
| `intro`              | `boolean`                          | `true`                        | Rows rise in, the lines draw and the band sweeps once down the menu.         |
| `active-index`       | `number`                           | —                             | Marks the current page row with a dot and `aria-current="page"`.             |
| `aria-label`         | `string`                           | `'Menu'`                      | Accessible name of the navigation.                                           |
| `class`              | `string`                           | `''`                          | Extra classes for the menu.                                                  |

### FlowingMenuItem

| Field     | Type     | Description                                        |
| --------- | -------- | -------------------------------------------------- |
| `text`    | `string` | Row label.                                         |
| `link`    | `string` | Renders the row as a link. Without it, a button.   |
| `image`   | `string` | Image shown between the marquee copies.            |
| `marquee` | `string` | Text that scrolls in the band. Defaults to `text`. |
| `meta`    | `string` | Short note at the end of the row.                  |

## Events

| Event        | Payload                                                     | Description        |
| ------------ | ----------------------------------------------------------- | ------------------ |
| `item-click` | `(item: FlowingMenuItem, index: number, event: MouseEvent)` | A row was clicked. |

## Accessibility

- The menu is a `<nav>` with a list; each row is a real link (or a button when it has no `link`).
- Keyboard focus moves the band to the focused row and shows a focus ring; leaving the menu sends the band out.
- The band, marquee copies, index, meta and arrow are `aria-hidden`, so screen readers read each row label once.
- With `prefers-reduced-motion: reduce` the band jumps instead of springing, the marquee stays still and the intro does not play.

- Ported from [React Bits](https://reactbits.dev/components/flowing-menu) by David Haz.
