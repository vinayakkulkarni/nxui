---
title: Depth Carousel
description: Cards recede into depth on a 3D rail, with drag, wheel, keyboard and auto-advance navigation.
---

An image carousel where the focused card sits in front and the rest fan back along a tilted 3D rail, dimming, tinting and blurring with distance. Drag or flick to scrub, scroll the wheel or trackpad, press the arrow keys, click a card or a dot, or let it auto-advance.

::demo-depth-carousel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/depth-carousel.json"
```

## Usage

```vue
<script setup lang="ts">
  import DepthCarousel from '~/components/ui/depth-carousel/DepthCarousel.vue';

  const items = [
    { image: 'https://picsum.photos/seed/dc-alto/800/1000', alt: 'Alto' },
    { image: 'https://picsum.photos/seed/dc-bay/800/1000', alt: 'Bay' },
    { image: 'https://picsum.photos/seed/dc-coast/800/1000', alt: 'Coast' },
  ];

  function onChange(index: number) {
    console.log('focused', index);
  }
</script>

<template>
  <div class="relative h-125 w-full">
    <DepthCarousel
      :items="items"
      :card-width="300"
      :card-height="380"
      :depth="220"
      :spread="90"
      :tilt="22"
      tilt-direction="right"
      ease="power3.out"
      autoplay
      @change="onChange"
    />
  </div>
</template>
```

The carousel fills its parent, so give the parent a height. It scales the stack down on narrow containers.

## Props

| Prop              | Type                                               | Default         | Description                                                                                                       |
| ----------------- | -------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `items`           | `Array<string \| { image: string; alt?: string }>` | 6 sample images | Slides to display. Pass image URLs or objects with an image URL and alt text.                                     |
| `card-width`      | `number`                                           | `300`           | Width of each card in px.                                                                                         |
| `card-height`     | `number`                                           | `380`           | Height of each card in px.                                                                                        |
| `radius`          | `number`                                           | `18`            | Corner rounding of the cards in px.                                                                               |
| `tint`            | `string`                                           | `'#05060a'`     | Colour multiplied over cards as they recede, shading the depth of the stack.                                      |
| `depth`           | `number`                                           | `220`           | Z distance in px between cards along the depth rail. Higher values push the stack further back.                   |
| `spread`          | `number`                                           | `90`            | Lateral offset in px applied per card so the stack fans out to one side.                                          |
| `tilt`            | `number`                                           | `22`            | Degrees each receding card rotates around the vertical axis, revealing its edge.                                  |
| `tilt-direction`  | `'left' \| 'right'`                                | `'right'`       | Which side the stack fans and tilts toward.                                                                       |
| `perspective`     | `number`                                           | `1400`          | CSS perspective in px. Lower values exaggerate the foreshortening.                                                |
| `visible-cards`   | `number`                                           | `4`             | How many cards deep stay visible before further ones fade out.                                                    |
| `falloff`         | `number`                                           | `0.2`           | How quickly brightness, tint and blur ramp up with depth.                                                         |
| `blur`            | `number`                                           | `6`             | Maximum blur in px on the furthest visible card.                                                                  |
| `duration`        | `number`                                           | `700`           | Length of the advance transition in ms.                                                                           |
| `ease`            | `string`                                           | `'power3.out'`  | GSAP-style ease name: `power0`–`power4`, `sine`, `expo`, `circ`, `back(n)` with `.in`/`.out`/`.inOut`, or `none`. |
| `autoplay`        | `boolean`                                          | `false`         | Auto-advance the carousel, pausing on hover or focus.                                                             |
| `autoplay-delay`  | `number`                                           | `3200`          | Delay between auto-advances in ms (at least 600).                                                                 |
| `loop`            | `boolean`                                          | `true`          | Wrap seamlessly from the last card back to the first.                                                             |
| `show-controls`   | `boolean`                                          | `true`          | Show the previous and next arrow buttons.                                                                         |
| `show-indicators` | `boolean`                                          | `true`          | Show the dot indicators.                                                                                          |
| `class`           | `string`                                           | `''`            | Extra classes for the root element.                                                                               |

## Events

| Event    | Payload                                                  | Description                              |
| -------- | -------------------------------------------------------- | ---------------------------------------- |
| `change` | `(index: number, item: { image: string; alt?: string })` | Fires whenever the focused card changes. |

## Accessibility

- The root is a focusable `role="group"` with `aria-roledescription="carousel"`. Left and Right arrow keys move between cards.
- Each card is a slide labelled "n of total"; slides other than the focused one are `aria-hidden`.
- The arrows are labelled buttons and the dots are a `tablist` with `aria-selected` on the current slide. All controls show a visible focus ring.
- With `prefers-reduced-motion: reduce` transitions jump instantly and autoplay is off.

- Ported from [React Bits](https://reactbits.dev/components/depth-carousel) by David Haz.
