---
title: Infinite Menu
description: A draggable WebGL sphere of image tiles that snaps the nearest tile to the front and shows its title, description and link.
---

A sphere of rounded image tiles drawn in one instanced WebGL2 call. Drag to spin it; when you let go it keeps turning, then snaps the nearest tile to the front and shows that item's title and description. Click another tile to bring it forward, click the front tile (or its arrow button) to open it, or focus the menu and use the arrow keys and Enter. It steps to the next tile on its own every few seconds and pauses while you hover or focus it.

::demo-infinite-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/infinite-menu.json"
```

## Usage

```vue
<script setup lang="ts">
  import InfiniteMenu from '~/components/ui/infinite-menu/InfiniteMenu.vue';
  import type { MenuItem } from '~/components/ui/infinite-menu/types';

  const items: MenuItem[] = [
    {
      image:
        'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600',
      link: 'https://nxui.geoql.in',
      title: 'Shoreline',
      description: 'Surf folding onto pale sand, seen straight from above.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600',
      title: 'Night Sky',
      description: 'Stars over a violet horizon long after dusk.',
    },
  ];

  function onActiveChange(item: MenuItem, index: number) {
    console.log(index, item.title);
  }
</script>

<template>
  <div class="relative h-140 w-full">
    <InfiniteMenu
      :items="items"
      :count="160"
      :tile-size="0.63"
      :autoplay="3"
      theme="dark"
      @active-change="onActiveChange"
    />
  </div>
</template>
```

Items repeat around the sphere when there are fewer items than tiles; neighbouring tiles never show the same image. Images are drawn into one texture atlas, so they must be served with CORS headers.

## Props

| Prop               | Type                    | Default  | Description                                                                                                                     |
| ------------------ | ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `items`            | `MenuItem[]`            | `[]`     | Items to show. They repeat around the sphere when there are fewer items than tiles.                                             |
| `count`            | `number`                | `160`    | Number of tiles on the sphere (6–400).                                                                                          |
| `tile-size`        | `number`                | `0.63`   | Tile size relative to the space around it. Lower values leave wider gaps.                                                       |
| `roundness`        | `number`                | `0.2`    | Tile shape, from 0 for squares to 1 for circles.                                                                                |
| `zoom`             | `number`                | `1.65`   | How close the camera sits to the active tile when the sphere is at rest.                                                        |
| `pull-back`        | `number`                | `1`      | How far the camera pulls back while you drag. 0 keeps it still.                                                                 |
| `stretch`          | `number`                | `0.6`    | How much the tiles stretch with fast motion.                                                                                    |
| `inertia`          | `number`                | `0.6`    | How long the sphere keeps spinning after you let go, from 0 to 1.                                                               |
| `autoplay`         | `number`                | `3`      | Seconds between automatic steps to the next tile. 0 turns it off. Pauses on hover and focus.                                    |
| `grayscale`        | `boolean`               | `true`   | Shows every tile except the active one in grayscale.                                                                            |
| `dim`              | `number`                | `0.5`    | Fades the tiles around the active one toward the background once the sphere settles (0–1).                                      |
| `intro`            | `boolean`               | `true`   | Spins the sphere into place when it loads.                                                                                      |
| `show-info`        | `boolean`               | `true`   | Shows the title, description and link button of the active item.                                                                |
| `theme`            | `'dark' \| 'light'`     | `'dark'` | Colors of the text, the button and the placeholder tiles.                                                                       |
| `accent-color`     | `string`                | —        | Background of the link button. Defaults to the theme's text color.                                                              |
| `background-color` | `string`                | —        | Background behind the sphere. Transparent by default.                                                                           |
| `on-item-click`    | `(item, index) => void` | —        | Called when the active tile or its button is clicked, or Enter is pressed. Replaces opening the link. Bind it as `@item-click`. |
| `class`            | `string`                | `''`     | Extra classes for the container.                                                                                                |

### MenuItem

| Field         | Type     | Description                                                |
| ------------- | -------- | ---------------------------------------------------------- |
| `image`       | `string` | Image URL (needs CORS headers).                            |
| `title`       | `string` | Title shown beside the active tile.                        |
| `description` | `string` | Short text shown on the other side.                        |
| `link`        | `string` | Opened by the button, a click on the front tile, or Enter. |

## Events

| Event           | Payload                           | Description                                                                |
| --------------- | --------------------------------- | -------------------------------------------------------------------------- |
| `active-change` | `(item: MenuItem, index: number)` | A new item settled in front.                                               |
| `item-click`    | `(item: MenuItem, index: number)` | The front tile, its button or Enter was used. Stops the link from opening. |

## Slots

| Slot   | Props                     | Description                                                               |
| ------ | ------------------------- | ------------------------------------------------------------------------- |
| `info` | `{ item, index, moving }` | Replaces the default title, description and button with your own overlay. |

## Accessibility

- The container is focusable (`role="group"`, `aria-roledescription="carousel"`) and is labelled with the active item's title.
- Arrow keys step to the neighbouring tile in that direction; Enter opens the active item.
- Autoplay pauses while the menu is hovered or focused.
- With `prefers-reduced-motion: reduce` the intro spin, motion stretch and autoplay are off, and the tiles fade in at once.
- The renderer sleeps once the sphere settles and stops while the menu is off screen.

- Ported from [React Bits](https://reactbits.dev/components/infinite-menu) by David Haz.
