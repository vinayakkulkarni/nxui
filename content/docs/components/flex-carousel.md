---
title: Flex Carousel
description: An infinite image row that flows through invisible liquid glass at its edges, with drag, wheel, keyboard and click-to-focus.
---

An endless row of images drawn with WebGL. An invisible glass lens sits in the middle: where the row crosses its edge, the images bend, twist and split into rainbow light, but stay connected. Drag, scroll or use the arrow keys to move the row. Click the centered card to open it; click, drag, scroll or press Escape to close it.

::demo-flex-carousel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flex-carousel.json"
```

## Usage

```vue
<script setup lang="ts">
  import FlexCarousel from '~/components/ui/flex-carousel/FlexCarousel.vue';
  import type { FlexCarouselItem } from '~/components/ui/flex-carousel/types';

  const items: FlexCarouselItem[] = [
    { src: '/photos/one.jpg', alt: 'A chrome sculpture', title: 'Chrome' },
    {
      src: '/photos/two.jpg',
      alt: 'A clay bust',
      title: 'Clay',
      subtitle: '2026',
    },
  ];

  function onSelect(index: number, item: FlexCarouselItem) {
    console.log(index, item.title);
  }
</script>

<template>
  <div class="relative h-135 w-full">
    <FlexCarousel
      :items="items"
      preset="vortex"
      intro="bloom"
      :radius="8"
      autoplay
      @select="onSelect"
    />
  </div>
</template>
```

The component fills its parent, so give the parent a height. Remote images must be served with CORS headers, because they are uploaded as WebGL textures. The lens props default to the values of the chosen `preset`; any lens prop you pass overrides the preset.

## Props

| Prop             | Type                                                 | Default          | Description                                                                                       |
| ---------------- | ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `items`          | `FlexCarouselItem[]`                                 | 12 sample photos | Images in the row (`src`, `alt`, `title`, `subtitle`). Each keeps its aspect unless `fit` is set. |
| `preset`         | `'liquid' \| 'ribbon' \| 'vortex' \| 'arch'`         | `'liquid'`       | Starting shape for the glass. Every lens prop below overrides it.                                 |
| `intro`          | `'rise' \| 'bloom' \| 'spin' \| 'deal' \| 'none'`    | `'rise'`         | Entrance once the images load. Any input skips it.                                                |
| `fit`            | `'natural' \| 'portrait' \| 'square' \| 'landscape'` | `'natural'`      | Card shape. Natural keeps each image uncropped; the others crop every card to one shape.          |
| `card-height`    | `number`                                             | `0.5`            | Card height as a fraction of the container height.                                                |
| `gap`            | `number`                                             | `12`             | Space between cards, in px.                                                                       |
| `radius`         | `number`                                             | `0`              | Corner radius of the cards, in px.                                                                |
| `lens-width`     | `number`                                             | from preset      | Width of the glass as a fraction of the container width.                                          |
| `lens-height`    | `number`                                             | from preset      | Height of the glass as a fraction of the container width.                                         |
| `tilt`           | `number`                                             | from preset      | Rotation of the glass in degrees. It sets where the edge crosses the row.                         |
| `roundness`      | `number`                                             | from preset      | Glass shape, from a rounded rectangle at 0 to an ellipse at 1.                                    |
| `bend`           | `number`                                             | from preset      | How far the row flexes where it passes the edge of the glass.                                     |
| `reach`          | `number`                                             | from preset      | Width of the curved edge. Small values give a tight kink, large values a long bend.               |
| `curl`           | `'twist' \| 'rise' \| 'fall'`                        | from preset      | Twist sends the left end down and the right end up; rise lifts both; fall drops both.             |
| `dispersion`     | `number`                                             | from preset      | Rainbow splitting of light where the edge bends the images.                                       |
| `liquid`         | `number`                                             | from preset      | How much the glass stretches and wobbles while the row moves. Off in every preset.                |
| `follow-cursor`  | `boolean`                                            | from preset      | The lens drifts after the cursor and returns to the center when it leaves.                        |
| `squeeze`        | `number`                                             | `0.2`            | How much the cards shrink while the row moves fast.                                               |
| `focus-on-click` | `boolean`                                            | `true`           | Clicking a card centers and opens it: the others part, the bend melts and the card grows.         |
| `autoplay`       | `boolean`                                            | `false`          | Advance one card at a time. Pauses on hover, focus, interaction and reduced motion.               |
| `interval`       | `number`                                             | `4`              | Seconds between autoplay steps.                                                                   |
| `captions`       | `boolean`                                            | `true`           | Show the title of the centered card and a counter below the row.                                  |
| `capture-wheel`  | `boolean`                                            | `true`           | Let a vertical mouse wheel scroll the row. Horizontal wheels and trackpads always scroll it.      |
| `class`          | `string`                                             | `''`             | Extra classes on the container.                                                                   |

## Events

| Event    | Payload                                   | Description                                                                        |
| -------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `change` | `(index: number, item: FlexCarouselItem)` | A different card reached the center.                                               |
| `select` | `(index: number, item: FlexCarouselItem)` | The centered card was clicked or Enter was pressed. A side card is centered first. |

## Accessibility

- The container is a focusable `region` with `aria-roledescription="carousel"` and a visible focus ring.
- Arrow keys move one card, Home and End jump to the first and last card, Enter or Space opens the centered card, and Escape closes it.
- An `aria-live` region announces the centered card's title (or alt text) and its position.
- The canvas is `aria-hidden`; the visible caption is decorative because the live region carries the same text.
- With `prefers-reduced-motion`, the intro becomes a short fade, autoplay, squeeze and the liquid wobble are off, and the caption animations are removed.

- Ported from [React Bits](https://reactbits.dev/components/flex-carousel) by David Haz.
