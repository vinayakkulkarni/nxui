---
title: Flying Posters
description: 3D posters that twist and flip as you scroll or drag through an endless column.
---

Scroll the mouse wheel over the posters or drag them up and down. Each poster twists and flips as it crosses the view, and the column loops forever. The canvas only animates while you use it, unless you set a drift `speed`. Add columns, round the corners, or pull the camera back with `camera-z`.

::demo-flying-posters
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flying-posters.json"
```

## Usage

```vue
<script setup lang="ts">
  import FlyingPosters from '~/components/ui/flying-posters/FlyingPosters.vue';
  import type { FlyingPostersItem } from '~/components/ui/flying-posters/types';

  const items = [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    { image: '/posters/city.webp', alt: 'City at night' },
  ];

  function onPosterClick(item: FlyingPostersItem, index: number) {
    console.log(index, item.image);
  }
</script>

<template>
  <div class="relative h-125 w-full">
    <FlyingPosters
      :items="items"
      :columns="3"
      :plane-width="200"
      :plane-height="260"
      :radius="12"
      :speed="30"
      @item-click="onPosterClick"
    />
  </div>
</template>
```

The component fills its parent, so give the parent a height. Remote images must allow CORS, because they are drawn into a WebGL texture.

## Props

| Prop           | Type                                       | Default      | Description                                                                         |
| -------------- | ------------------------------------------ | ------------ | ----------------------------------------------------------------------------------- |
| `items`        | `Array<string \| FlyingPostersItem>`       | `[]`         | Poster images. Each is cropped to fill its poster; they repeat to fill the view.    |
| `plane-width`  | `number`                                   | `320`        | Poster width in px at the default camera.                                           |
| `plane-height` | `number`                                   | `320`        | Poster height in px at the default camera.                                          |
| `distortion`   | `number`                                   | `3`          | How far one corner turns ahead of the other, which gives the twist.                 |
| `scroll-ease`  | `number`                                   | `0.01`       | How quickly the posters catch up with wheel and drag. Lower glides longer.          |
| `camera-fov`   | `number`                                   | `45`         | Camera field of view in degrees. Wider angles zoom out.                             |
| `camera-z`     | `number`                                   | `20`         | Camera distance. Higher shows posters smaller and flatter; lower brings them close. |
| `gap`          | `number`                                   | `undefined`  | Space between posters in px. Defaults to a spacing that follows the camera.         |
| `columns`      | `number`                                   | `1`          | Number of poster columns (1–8).                                                     |
| `column-gap`   | `number`                                   | `40`         | Space between columns in px.                                                        |
| `alternate`    | `boolean`                                  | `true`       | Moves every other column in the opposite direction.                                 |
| `radius`       | `number`                                   | `0`          | Corner radius of the posters in px.                                                 |
| `rotation`     | `number`                                   | `180`        | How far each poster turns while it crosses the view, in degrees.                    |
| `axis`         | `'vertical' \| 'horizontal' \| 'diagonal'` | `'vertical'` | Axis the posters turn around.                                                       |
| `speed`        | `number`                                   | `0`          | Drift in px per second while idle. Negative values drift down.                      |
| `lean`         | `number`                                   | `0`          | How far the posters lean back with fast scrolling (0–2).                            |
| `fade`         | `number`                                   | `0`          | Fades the posters toward the top and bottom edges, 0 to 1.                          |
| `shading`      | `number`                                   | `0`          | Darkens the posters as they turn away, 0 to 1.                                      |
| `wheel`        | `boolean`                                  | `true`       | Scrolls the posters with the mouse wheel while hovered.                             |
| `drag`         | `boolean`                                  | `true`       | Scrolls the posters by dragging them.                                               |
| `page-scroll`  | `number`                                   | `0`          | Moves the posters with the page scroll, as a multiplier. 0 turns it off.            |
| `class`        | `string`                                   | `''`         | Extra classes for the container.                                                    |

### FlyingPostersItem

| Field   | Type     | Description                                |
| ------- | -------- | ------------------------------------------ |
| `image` | `string` | Image URL                                  |
| `link`  | `string` | Optional link to use in your click handler |
| `alt`   | `string` | Optional description                       |

## Events

| Event        | Payload                                    | Description                               |
| ------------ | ------------------------------------------ | ----------------------------------------- |
| `item-click` | `(item: FlyingPostersItem, index: number)` | Fired when a poster is clicked or tapped. |

## Accessibility

- The canvas has `role="img"`. It is decorative motion, so keep important content and links elsewhere on the page too.
- With `prefers-reduced-motion: reduce`, the drift, lean and fade-in are off; the posters move only when you scroll or drag.
- The canvas pauses when it is off screen.

- Ported from [React Bits](https://reactbits.dev/components/flying-posters) by David Haz.
