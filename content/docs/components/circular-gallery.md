---
title: Circular Gallery
description: A curved WebGL image gallery you can drag, scroll or tab through, with cards that open to the full image.
---

Cards sit on a circular arc and ripple while the gallery moves. Drag, scroll or use the arrow keys to move through them; it settles on the nearest card. Click a card to open it to the full image, then click it again, click outside, press Escape or use the close button to return.

::demo-circular-gallery
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/circular-gallery.json"
```

## Usage

```vue
<script setup lang="ts">
  import CircularGallery from '~/components/ui/circular-gallery/CircularGallery.vue';
  import type { GalleryItem } from '~/components/ui/circular-gallery/types';

  const items: GalleryItem[] = [
    { image: 'https://picsum.photos/seed/1/800/600', text: 'Bridge' },
    { image: 'https://picsum.photos/seed/2/800/600', text: 'Desk Setup' },
    {
      image: 'https://picsum.photos/seed/3/800/600',
      text: 'Waterfall',
      description: 'Shown under the title when the card is open.',
    },
  ];
</script>

<template>
  <div class="relative h-125 w-full">
    <CircularGallery
      :items="items"
      :bend="3"
      text-color="#ffffff"
      :border-radius="0.05"
      :auto-scroll="0"
    />
  </div>
</template>
```

The gallery fills its parent, so give the parent a height. It renders with raw WebGL2 (no extra dependencies): one shader draws each card as a signed-distance rounded rectangle with a soft shadow, so edges stay crisp at any size.

## Props

| Prop            | Type            | Default               | Description                                                                                                                |
| --------------- | --------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `items`         | `GalleryItem[]` | 12 sample photos      | Images to show. `text` is the title, `description` appears under it when open, `alt` names the image.                      |
| `bend`          | `number`        | `3`                   | Curvature of the arc. Positive arches the cards down at the edges, negative lifts them, `0` lays them flat.                |
| `item-size`     | `number`        | `1`                   | Card height relative to the container, from 0.2 to 2.                                                                      |
| `item-aspect`   | `number`        | `0.78`                | Card width divided by height. Images are cropped to fill the card.                                                         |
| `gap`           | `number`        | `0.26`                | Space between cards as a fraction of the card width.                                                                       |
| `border-radius` | `number`        | `0.05`                | Corner radius as a fraction of the card size, from 0 (square) to 0.5 (fully round).                                        |
| `wave`          | `number`        | `1`                   | How much the cards ripple while the gallery moves. `0` keeps them flat.                                                    |
| `fade-edges`    | `number`        | `0.12`                | Fades the cards out toward the left and right edges, from 0 to 0.5 of the width.                                           |
| `shadow`        | `number`        | `0.25`                | Strength of the soft shadow under each card.                                                                               |
| `text-color`    | `string`        | `'#ffffff'`           | Color of the titles, the keyboard focus ring and the placeholder shown while images load.                                  |
| `font`          | `string`        | `'bold 30px Figtree'` | CSS font shorthand for the titles. 30px is the default size; larger values make the titles bigger.                         |
| `font-url`      | `string`        | `undefined`           | Stylesheet URL (e.g. Google Fonts) or font file (.woff2, .woff, .ttf, .otf). The loaded family replaces the one in `font`. |
| `show-titles`   | `boolean`       | `true`                | Shows the title of each card underneath it.                                                                                |
| `scroll-speed`  | `number`        | `2`                   | How far the gallery travels per drag or wheel movement.                                                                    |
| `scroll-ease`   | `number`        | `0.05`                | How quickly the gallery catches up with the input, from 0.001 (floaty) to 1 (instant).                                     |
| `snap`          | `boolean`       | `true`                | Settles on the nearest card after dragging or scrolling.                                                                   |
| `auto-scroll`   | `number`        | `0`                   | Automatic drift speed; 1 moves about one card every four seconds, negative drifts the other way. Pauses on input.          |
| `grayscale`     | `boolean`       | `false`               | Shows the images in grayscale and brings the color back on hover, focus or when opened.                                    |
| `open-on-click` | `boolean`       | `true`                | Clicking a card opens it to its full image. When off, clicking a card centers it.                                          |
| `intro`         | `boolean`       | `true`                | Glides the cards in when the gallery mounts.                                                                               |
| `dpr`           | `number`        | device ratio          | Maximum device pixel ratio, capped at 2.                                                                                   |
| `class`         | `string`        | `''`                  | Extra classes for the container.                                                                                           |

## Events

| Event           | Payload                              | Description                               |
| --------------- | ------------------------------------ | ----------------------------------------- |
| `item-click`    | `(item: GalleryItem, index: number)` | A card was clicked.                       |
| `active-change` | `(index: number)`                    | A different card became the centered one. |

## Accessibility

- The container is a `region` with `aria-roledescription="carousel"`. A visually hidden list holds one button per image with a roving `tabindex`, so Tab reaches the gallery once and the arrow keys move between cards. Home and End jump to the first and last card.
- Keyboard focus draws a ring around the centered card. Enter opens it; Escape closes it. A live region announces the opened image.
- With `prefers-reduced-motion: reduce`, the intro, wave, auto-scroll and easing are turned off and moves happen instantly.

- Ported from [React Bits](https://reactbits.dev/components/circular-gallery) by David Haz.
