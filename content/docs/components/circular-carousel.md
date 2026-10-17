---
title: Circular Carousel
description: A 3D ring of images with bendable cards, momentum drag, snapping and click to focus.
---

# Circular Carousel

A ring of photos in 3D. The cards bend to follow the ring, the ring drifts on its own, and you can grab and throw it with a mouse, a finger or a horizontal trackpad scroll. When it comes to rest it snaps onto a card. Click a card to turn it to the front, or focus the ring and use the arrow keys. Four presets change the shape: cylinder, orbit, wheel and panorama.

::demo-circular-carousel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/circular-carousel.json"
```

## Usage

```vue
<script setup lang="ts">
  import CircularCarousel from '~/components/ui/circular-carousel/CircularCarousel.vue';
  import type { CircularCarouselItem } from '~/components/ui/circular-carousel/types';

  const photos: CircularCarouselItem[] = [
    {
      src: '/photos/valley.jpg',
      alt: 'Mist in a valley',
      title: 'Valley',
      subtitle: 'Landscape',
    },
    {
      src: '/photos/towers.jpg',
      alt: 'Glass towers',
      title: 'Towers',
      subtitle: 'Architecture',
    },
    // …
  ];

  function onItemClick(item: CircularCarouselItem) {
    console.log(item.title);
  }
</script>

<template>
  <div class="relative h-140 w-full">
    <CircularCarousel
      :items="photos"
      preset="cylinder"
      intro="rise"
      fade-color="var(--background)"
      captions
      @item-click="onItemClick"
    />
  </div>
</template>
```

The carousel fills its container and scales the whole ring down when it does not fit, so give the parent a height. Passing a new `items` list with the same length crossfades each card to its new image, starting from the front.

## Props

| Prop             | Type                                             | Default          | Description                                                                                       |
| ---------------- | ------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------- |
| `items`          | `CircularCarouselItem[]`                         | 10 sample photos | Images on the ring: `{ src, alt?, title?, subtitle? }`. `alt` is announced, `title` is captioned. |
| `preset`         | `'cylinder' \| 'orbit' \| 'wheel' \| 'panorama'` | `'cylinder'`     | Ring shape. Orbit keeps cards facing you, wheel spins top to bottom, panorama sits inside.        |
| `intro`          | `'assemble' \| 'rise' \| 'spin' \| 'none'`       | `'rise'`         | Entrance once the images load.                                                                    |
| `card-width`     | `number`                                         | `220`            | Card width in px.                                                                                 |
| `aspect-ratio`   | `number`                                         | `1`              | Card width divided by its height. Images are cropped to fill.                                     |
| `gap`            | `number`                                         | `25`             | Space between neighbouring cards, in px.                                                          |
| `curve`          | `number`                                         | from preset      | Card bend, from flat (0) to fully wrapped (1). Ignored by orbit.                                  |
| `tilt`           | `number`                                         | from preset      | Camera angle in degrees. Negative values look down onto the ring.                                 |
| `perspective`    | `number`                                         | from preset      | Camera distance in px. Panorama sets its own.                                                     |
| `autoplay`       | `'drift' \| 'step' \| 'off'`                     | `'drift'`        | Drift turns continuously, step moves one card at a time, off only moves when you do.              |
| `speed`          | `number`                                         | `14`             | Drift speed in degrees per second.                                                                |
| `interval`       | `number`                                         | `3`              | Seconds between moves in step mode.                                                               |
| `direction`      | `'left' \| 'right'`                              | `'left'`         | Which way the front cards travel. A flick changes it. On the wheel, left means up.                |
| `draggable`      | `boolean`                                        | `true`           | Grab and throw the ring with a pointer or horizontal scroll.                                      |
| `momentum`       | `number`                                         | `0.6`            | How long a throw keeps gliding before it blends back into autoplay, from 0 to 1.                  |
| `snap`           | `boolean`                                        | `true`           | Settle on a card whenever the ring comes to rest.                                                 |
| `pause-on-hover` | `boolean`                                        | `true`           | Ease the ring to a stop while the pointer is over it.                                             |
| `focus-on-click` | `boolean`                                        | `true`           | Clicking a card turns it to the front.                                                            |
| `parallax`       | `number`                                         | `0.3`            | How much the camera leans toward the pointer, from 0 to 1.                                        |
| `stretch`        | `number`                                         | `0.5`            | How much the ring swells outward when it spins fast, from 0 to 1.                                 |
| `depth-fade`     | `number`                                         | `0.55`           | How strongly cards fade into `fade-color` as they turn away, from 0 to 1.                         |
| `fade-color`     | `string`                                         | `'#000000'`      | Color distant cards fade toward. Match the background; `var(--background)` works.                 |
| `inner-shade`    | `number`                                         | `0.6`            | Brightness of the inside faces seen through the back of the ring, from 0 to 1.                    |
| `corner-radius`  | `number`                                         | `12`             | Corner radius of the cards, in px.                                                                |
| `captions`       | `boolean`                                        | `false`          | Show the front card's title, subtitle and position under the ring.                                |
| `class`          | `string`                                         | `''`             | Extra classes on the root.                                                                        |

## Events

| Event        | Payload                                       | Description                                                   |
| ------------ | --------------------------------------------- | ------------------------------------------------------------- |
| `change`     | `(index: number)`                             | A different card reached the front.                           |
| `item-click` | `(item: CircularCarouselItem, index: number)` | A card was clicked, or Enter / Space was pressed on the ring. |

## Accessibility

- The root is a focusable `region` with `aria-roledescription="carousel"`; each card is a `group` with `aria-roledescription="slide"` and a "title, n of total" label.
- Arrow keys step one card (Left / Right, or Up / Down on the wheel), Home and End jump to the first and last card, Enter and Space fire `item-click` for the front card.
- A polite live region announces the front card as it changes.
- With `prefers-reduced-motion: reduce`, the intro, autoplay, parallax and stretch are turned off; dragging and keys still work.

- Ported from [React Bits](https://reactbits.dev/components/circular-carousel) by David Haz.
