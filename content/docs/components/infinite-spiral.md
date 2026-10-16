---
title: Infinite Spiral
description: An endlessly looping 3D helix of images with adjustable motion, depth and spacing.
---

A looping helix of image cards. Cards wind around a vertical axis, grow near the centre and blur and fade at the ends. It can play by itself, follow a vertical drag, follow page scroll, or all three.

::demo-infinite-spiral
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/infinite-spiral.json"
```

## Usage

```vue
<script setup lang="ts">
  import InfiniteSpiral from '~/components/ui/infinite-spiral/InfiniteSpiral.vue';
  import type { InfiniteSpiralItem } from '~/components/ui/infinite-spiral/types';

  const items: Array<string | InfiniteSpiralItem> = [
    'https://images.unsplash.com/photo-1781764177519-9c9c88733c3e?w=900',
    {
      src: 'https://images.unsplash.com/photo-1774009485852-13a515d32e36?w=900',
      alt: 'Fern',
      href: '/ferns',
    },
  ];
</script>

<template>
  <div class="relative h-155 w-full overflow-hidden">
    <InfiniteSpiral
      :items="items"
      animation-mode="all"
      :cards-per-turn="7"
      :grayscale="1"
    />
  </div>
</template>
```

The spiral fills its parent, so give the parent a height. Use at least as many items as `cards-per-turn` for a full turn.

## Props

| Prop               | Type                                                       | Default   | Description                                                   |
| ------------------ | ---------------------------------------------------------- | --------- | ------------------------------------------------------------- |
| `items`            | `Array<string \| InfiniteSpiralItem>`                      | `[]`      | Image URLs or `{ id?, src, alt?, href?, target?, label? }`.   |
| `speed`            | `number`                                                   | `0.55`    | Auto-play speed in cards per second.                          |
| `direction`        | `'up' \| 'down'`                                           | `'up'`    | Auto-play direction.                                          |
| `animation-mode`   | `'auto' \| 'drag' \| 'scroll' \| 'all'`                    | `'auto'`  | Plays by itself, follows a drag, follows page scroll, or all. |
| `radius`           | `number`                                                   | `170`     | Helix radius in pixels. Shrinks on narrow containers.         |
| `card-width`       | `number`                                                   | `100`     | Card width in pixels.                                         |
| `card-height`      | `number`                                                   | `100`     | Card height in pixels.                                        |
| `vertical-spacing` | `number`                                                   | `60`      | Vertical distance between cards in pixels.                    |
| `perspective`      | `number`                                                   | `1000`    | Perspective distance in pixels.                               |
| `cards-per-turn`   | `number`                                                   | `7`       | Cards in one full turn of the helix.                          |
| `rotation`         | `number`                                                   | `0`       | Extra rotation of the helix in degrees.                       |
| `card-tilt`        | `number`                                                   | `0`       | In-plane tilt of every card in degrees.                       |
| `card-radius`      | `number`                                                   | `10`      | Card corner radius in pixels.                                 |
| `center-scale`     | `number`                                                   | `1.2`     | Scale of the card at the centre of the helix.                 |
| `edge-fade`        | `number`                                                   | `0.3`     | Part of the helix that fades out at each end (0–1).           |
| `edge-blur`        | `number`                                                   | `6`       | Largest blur in pixels on cards near the ends.                |
| `pause-on-hover`   | `boolean`                                                  | `true`    | Pause auto-play while the pointer is over the spiral.         |
| `image-fit`        | `'cover' \| 'contain' \| 'fill' \| 'none' \| 'scale-down'` | `'cover'` | CSS `object-fit` of the images.                               |
| `grayscale`        | `number`                                                   | `0`       | Grayscale amount of the images (0–1).                         |

## Accessibility

- The stage is a `role="list"`; each card is a list item named by its `label` or `alt`. Cards with an `href` are links and keep the browser focus ring.
- A drag that moves the spiral does not trigger a click on the card under the pointer.
- With `prefers-reduced-motion: reduce` auto-play stops. Drag and scroll still move the spiral because the user drives them.

- Ported from [React Bits](https://reactbits.dev/components/infinite-spiral) by David Haz.
