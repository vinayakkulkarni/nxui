---
title: Scroll Tilted Grid
description: A two-column image gallery whose frames tilt, blur and dim at the viewport edges and settle into focus as they cross the center.
---

A two-column image gallery that reacts to scroll. Each frame tilts back in 3D, drifts sideways, blurs and dims near the top and bottom edges, then settles flat and sharp as it crosses the middle of the viewport. Scroll the demo to try it. Wheel scrolling is eased by default, and `loop` keeps adding image cycles as you reach the end.

::demo-scroll-tilted-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-tilted-grid.json"
```

## Usage

```vue
<script setup lang="ts">
  import ScrollTiltedGrid from '~/components/ui/scroll-tilted-grid/ScrollTiltedGrid.vue';
  import type { ScrollTiltedGridImage } from '~/components/ui/scroll-tilted-grid/types';

  const images: ScrollTiltedGridImage[] = [
    {
      src: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=85',
      alt: 'Curved concrete facade in soft daylight',
    },
    {
      src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85',
      alt: 'Sunlit modern interior with warm timber details',
    },
  ];
</script>

<template>
  <ScrollTiltedGrid :images="images" :max-tilt="62" :max-blur="7" />
</template>
```

The gallery tracks the window by default. To run it inside a scrolling panel, pass that element as `scroll-container`:

```vue
<script setup lang="ts">
  const panel = useTemplateRef<HTMLElement>('panel');
</script>

<template>
  <div ref="panel" class="h-160 overflow-y-auto">
    <ScrollTiltedGrid :images="images" :scroll-container="panel" />
  </div>
</template>
```

## Props

| Prop               | Type                               | Default     | Description                                                                                         |
| ------------------ | ---------------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `images`           | `readonly ScrollTiltedGridImage[]` | required    | Images to render. Each item has a `src` and descriptive `alt` text.                                 |
| `loop`             | `boolean`                          | `false`     | Appends more image cycles as the end of the gallery comes near.                                     |
| `initial-cycles`   | `number`                           | `2`         | Cycles rendered at first when looping is on.                                                        |
| `max-cycles`       | `number`                           | `4`         | Most cycles the gallery grows to.                                                                   |
| `smooth-scroll`    | `boolean`                          | `true`      | Eases wheel scrolling on the scroll target. Turn it off when the app already owns smooth scrolling. |
| `aspect-ratio`     | `string`                           | `'4 / 5'`   | CSS aspect ratio of every frame.                                                                    |
| `perspective`      | `number`                           | `1000`      | Perspective depth in pixels for every frame.                                                        |
| `max-tilt`         | `number`                           | `62`        | Largest `rotateX` angle at the entry and exit edges.                                                |
| `max-blur`         | `number`                           | `7`         | Largest blur in pixels away from the viewport focus point.                                          |
| `rounded`          | `string`                           | `'0.25rem'` | CSS border radius of every frame.                                                                   |
| `section-padding`  | `string`                           | `'18vh'`    | Top and bottom padding around the grid.                                                             |
| `scroll-container` | `HTMLElement \| null`              | `undefined` | Scrolling element to track. Omit to track the window.                                               |
| `class`            | `string`                           | `undefined` | Extra classes on the gallery section.                                                               |

## Accessibility

- The gallery is a labelled `<section>`, and every image keeps its `alt` text.
- With `prefers-reduced-motion: reduce`, frames stay flat and sharp, and smooth wheel scrolling is turned off.
- Only wheel input is eased. Keyboard, touch and scrollbar scrolling stay native.

## Credits

- Ported from [componentry.fun](https://componentry.dev/docs/components/scroll-tilted-grid) by Harsh Jadhav.
