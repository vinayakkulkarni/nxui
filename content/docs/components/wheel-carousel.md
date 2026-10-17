---
title: Wheel Carousel
description: A rotating-wheel picker with inertial drag and scroll, curved fading labels, and a crossfading image for the active item.
---

A rotating-wheel picker. Labels sit on the rim of a large wheel and fade as they curve away; the active item's photo crossfades in beside it. Drag up or down, scroll with the mouse wheel, or focus it and use the arrow keys, Home and End.

::demo-wheel-carousel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/wheel-carousel.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import WheelCarousel from '~/components/ui/wheel-carousel/WheelCarousel.vue';
  import type { WheelCarouselItem } from '~/components/ui/wheel-carousel/types';

  const projects: WheelCarouselItem[] = [
    {
      label: 'Canyon House',
      image: '/images/projects/canyon-house.jpg',
      imageAlt: 'Modern concrete home built into a desert canyon',
    },
    {
      label: 'Harbor Loft',
      image: '/images/projects/harbor-loft.jpg',
      imageAlt: 'Bright coastal loft with large windows',
    },
    {
      label: 'Glass Pavilion',
      image: '/images/projects/glass-pavilion.jpg',
      imageAlt: 'Minimal glass pavilion surrounded by trees',
    },
  ];

  const active = ref(0);
</script>

<template>
  <div class="h-170 w-full">
    <WheelCarousel
      v-model:active-index="active"
      :items="projects"
      photo-side="right"
      photo-aspect="4/3"
      :photo-width="30"
      :gap="24"
      :radius="260"
      :spacing="13"
      :visible-items="6"
    />
  </div>
</template>
```

In `system` mode the palette follows the site's color mode (white or black canvas). `light` and `dark` pin one of them; `custom` uses the `background`, `panel-color`, `text-color`, `selected-color` and `marker-color` props.

## Props

| Prop                 | Type                                        | Default                     | Description                                                      |
| -------------------- | ------------------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| `items`              | `WheelCarouselItem[]`                       | 24 sample projects          | Labels and photos. Each item takes `label`, `image`, `imageAlt?` |
| `mode`               | `'system' \| 'light' \| 'dark' \| 'custom'` | `'system'`                  | Automatic, fixed, or custom colors                               |
| `photo-side`         | `'left' \| 'right'`                         | `'left'`                    | Side of the wheel that holds the active image                    |
| `photo-width`        | `number`                                    | `24`                        | Image column width (%)                                           |
| `photo-aspect`       | `'3/4' \| '1/1' \| '4/3' \| '3/2'`          | `'3/4'`                     | Aspect ratio of the active image                                 |
| `photo-radius`       | `number`                                    | `14`                        | Corner radius of the image (px)                                  |
| `content-width`      | `number`                                    | `900`                       | Max inner content width (px)                                     |
| `gap`                | `number`                                    | `0`                         | Space between image column and wheel (px)                        |
| `radius`             | `number`                                    | `320`                       | Radius of the label wheel (px)                                   |
| `spacing`            | `number`                                    | `14`                        | Angle between labels (deg)                                       |
| `visible-items`      | `number`                                    | `7`                         | Labels visible on each side of the selection                     |
| `apex-inset`         | `number`                                    | `34`                        | Horizontal position of the selection point (%)                   |
| `snap`               | `boolean`                                   | `true`                      | Settle on the nearest whole item                                 |
| `momentum`           | `boolean`                                   | `true`                      | Keep drag and wheel velocity after input ends                    |
| `appear`             | `boolean`                                   | `true`                      | Play an entrance animation on mount                              |
| `crossfade-duration` | `number`                                    | `0.5`                       | Image crossfade duration (s)                                     |
| `scroll-speed`       | `number`                                    | `0.008`                     | Rotation per wheel delta pixel                                   |
| `drag-speed`         | `number`                                    | `0.02`                      | Rotation per dragged pixel                                       |
| `background`         | `string`                                    | `'rgb(255, 246, 236)'`      | Canvas color in `custom` mode                                    |
| `panel-color`        | `string`                                    | `background`                | Image placeholder color in `custom` mode                         |
| `text-color`         | `string`                                    | `'rgba(180, 90, 20, 0.45)'` | Inactive label color in `custom` mode                            |
| `selected-color`     | `string`                                    | `'rgb(180, 84, 30)'`        | Active label color in `custom` mode                              |
| `show-marker`        | `boolean`                                   | `true`                      | Show the dot at the selection point                              |
| `marker-color`       | `string`                                    | `'rgb(232, 121, 46)'`       | Dot color in `custom` mode                                       |
| `marker-size`        | `number`                                    | `16`                        | Dot diameter (px)                                                |
| `marker-gap`         | `number`                                    | `20`                        | Distance between dot and labels (px)                             |
| `edge-fade`          | `boolean`                                   | `true`                      | Fade labels at the top and bottom edges                          |
| `edge-fade-size`     | `number`                                    | `30`                        | Size of the edge fade (%)                                        |
| `active-index`       | `number`                                    | —                           | Controlled active index (supports `v-model:active-index`)        |
| `initial-index`      | `number`                                    | `0`                         | Initially selected item when uncontrolled                        |
| `class`              | `string`                                    | `''`                        | Classes for the outer container                                  |
| `photo-class`        | `string`                                    | `''`                        | Classes for the image frame                                      |
| `item-class`         | `string`                                    | `''`                        | Classes for each wheel label                                     |

## Events

| Event                 | Payload                                    | Description                        |
| --------------------- | ------------------------------------------ | ---------------------------------- |
| `active-change`       | `(item: WheelCarouselItem, index: number)` | Fires when the active item changes |
| `update:active-index` | `(index: number)`                          | `v-model:active-index` update      |

## Accessibility

- The wheel is a focusable `listbox`; each visible label is an `option` and `aria-activedescendant` tracks the selection.
- Arrow keys move one item, Home and End jump to the first and last item.
- A polite live region announces the active label and its position.
- With `prefers-reduced-motion`, the entrance animation, momentum and crossfade are removed and the wheel snaps at once.

## Credits

- Ported from [componentry.fun](https://componentry.dev/docs/components/wheel-carousel) by Harsh Jadhav.
