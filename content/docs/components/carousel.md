---
title: Carousel
description: Swipeable cards for feature tours, stories and galleries, with five transitions, momentum dragging and an autoplay timer.
---

Swipeable cards with spring physics. Drag or flick the cards and they glide into place, scroll sideways with a trackpad, use the arrow keys, Home and End, or click a neighbouring card. Pick one of five transitions (tilt, slide, scale, fade, cube) and dots, timer bars or a counter underneath. Cards can show an icon, a title, a description or a full photo; pass a slot for anything else.

::demo-carousel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/carousel.json"
```

## Usage

```vue
<script setup lang="ts">
  import Carousel from '~/components/ui/carousel/Carousel.vue';
  import type { CarouselItem } from '~/components/ui/carousel/types';

  const photos: CarouselItem[] = [
    {
      id: 1,
      image: '/fields.jpg',
      title: 'Open fields',
      description: 'Golden light over the wheat at dusk.',
    },
    {
      id: 2,
      image: '/night.jpg',
      title: 'Night sky',
      description: 'Stars over the ridge.',
    },
  ];

  function onChange(index: number) {
    console.log('now showing', index);
  }
</script>

<template>
  <!-- Feature tour with the default cards -->
  <Carousel />

  <!-- Photo highlights -->
  <Carousel
    :items="photos"
    :base-width="640"
    :aspect-ratio="1.6"
    :peek="64"
    :radius="20"
    :frame="false"
    effect="scale"
    indicator="bars"
    arrows
    autoplay
    :autoplay-delay="4000"
    pause-on-hover
    loop
    @change="onChange"
  />

  <!-- Your own card content -->
  <Carousel :items="photos" effect="cube" :frame="false">
    <template #item="{ item, active }">
      <div class="grid size-full place-items-center">
        {{ typeof item === 'string' ? item : item.title }}
        {{ active ? '(active)' : '' }}
      </div>
    </template>
  </Carousel>
</template>
```

## Props

| Prop             | Type                                               | Default         | Description                                                                                                                          |
| ---------------- | -------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `items`          | `Array<CarouselItem \| string>`                    | 5 feature cards | Objects with `image`, `icon` (Iconify name), `title`, `description` and `alt` get the built-in card; strings are used as image URLs. |
| `base-width`     | `number \| string`                                 | `300`           | Width in px, or any CSS width. It never grows past its container.                                                                    |
| `aspect-ratio`   | `number`                                           | `1.25`          | Width of a card divided by its height.                                                                                               |
| `peek`           | `number`                                           | `0`             | Space on each side of the active card where the neighbours show, in px. Works with slide and scale.                                  |
| `gap`            | `number`                                           | `16`            | Space between the cards in px.                                                                                                       |
| `radius`         | `number`                                           | `12`            | Corner radius of the cards in px.                                                                                                    |
| `frame`          | `boolean`                                          | `true`          | Holds the cards and controls in a glass panel. Without it the cards fade out at the edges.                                           |
| `effect`         | `'tilt' \| 'slide' \| 'scale' \| 'fade' \| 'cube'` | `'tilt'`        | How the cards move from one to the next.                                                                                             |
| `indicator`      | `'dots' \| 'bars' \| 'counter' \| 'none'`          | `'dots'`        | Navigation under the cards. Bars fill up with the autoplay timer.                                                                    |
| `arrows`         | `boolean`                                          | `false`         | Shows previous and next buttons.                                                                                                     |
| `autoplay`       | `boolean`                                          | `false`         | Moves to the next card on a timer.                                                                                                   |
| `autoplay-delay` | `number`                                           | `3000`          | Time on each card in ms while autoplay is on (minimum 600).                                                                          |
| `pause-on-hover` | `boolean`                                          | `false`         | Pauses autoplay while the pointer is over the carousel.                                                                              |
| `loop`           | `boolean`                                          | `false`         | Wraps around from the last card to the first and back.                                                                               |
| `draggable`      | `boolean`                                          | `true`          | Lets people drag, swipe or scroll sideways through the cards.                                                                        |
| `round`          | `boolean`                                          | `false`         | Turns the cards into circles.                                                                                                        |
| `initial-index`  | `number`                                           | `0`             | Card shown first.                                                                                                                    |
| `theme`          | `'dark' \| 'light'`                                | `'dark'`        | Color scheme of the cards, frame and controls.                                                                                       |
| `class`          | `string`                                           | `''`            | Extra classes on the root.                                                                                                           |

## Events

| Event    | Payload         | Description                                  |
| -------- | --------------- | -------------------------------------------- |
| `change` | `index: number` | Fired with the index of the new active card. |

## Slots

| Slot   | Props                                                              | Description                                         |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------- |
| `item` | `{ item: CarouselItem \| string, index: number, active: boolean }` | Replaces the built-in card content for every slide. |

## Accessibility

- The root is a focusable `region` with `aria-roledescription="carousel"`; each slide is a `group` labelled “N of M”.
- Arrow Left/Right step, Home/End jump to the first and last card. Keyboard focus pauses autoplay.
- Dots and bars are buttons with `aria-current` on the active one; arrows are disabled at the ends unless `loop` is on.
- Announcements are polite when autoplay is off and silenced while it runs. With `prefers-reduced-motion`, cards jump without the spring.

- Ported from [React Bits](https://reactbits.dev/components/carousel) by David Haz.
