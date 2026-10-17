---
title: Pixel Transition
description: Retro pixel dissolve that covers a card in solid pixels, swaps the content underneath and clears again.
---

A card that dissolves into pixels, swaps to its second slot at the midpoint and clears again. Hover it (or tab to it) to reveal the second content; with `trigger="click"` it toggles on click, tap, Enter or Space. Quick hovers reverse smoothly instead of jumping.

::demo-pixel-transition
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-transition.json"
```

## Usage

```vue
<script setup lang="ts">
  import PixelTransition from '~/components/ui/pixel-transition/PixelTransition.vue';
</script>

<template>
  <PixelTransition
    pattern="ripple"
    pixel-animation="grow"
    pixel-shape="circle"
    :grid-size="16"
    :gap="2"
    aspect-ratio="125%"
  >
    <template #first>
      <img src="/night.webp" alt="" class="size-full object-cover" />
    </template>
    <template #second>
      <img src="/day.webp" alt="" class="size-full object-cover" />
    </template>
  </PixelTransition>
</template>
```

The pixels are drawn on one canvas. Progress runs from 0 to 1: the first half covers the card, the content swaps at the middle, the second half clears it. Ripple spreads from the pointer and wipe sweeps in from the edge the pointer crossed.

## Props

| Prop                      | Type                                         | Default     | Description                                                                                   |
| ------------------------- | -------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `grid-size`               | `number`                                     | `10`        | Pixels across the card (2–80). Rows follow so every pixel stays square.                       |
| `pixel-color`             | `string`                                     | `'#ffffff'` | Color of the pixels. Any CSS color works.                                                     |
| `mosaic`                  | `number`                                     | `0`         | Gives each pixel a slightly different tone of the pixel color, 0–1.                           |
| `animation-step-duration` | `number`                                     | `0.4`       | Seconds the pixels take to cover the card, and again to clear it.                             |
| `pattern`                 | `'random' \| 'dither' \| 'ripple' \| 'wipe'` | `'random'`  | Order the pixels appear in.                                                                   |
| `randomness`              | `number`                                     | `0.3`       | Breaks up the ripple and wipe fronts, 0–1.                                                    |
| `pixel-animation`         | `'pop' \| 'grow' \| 'fade'`                  | `'pop'`     | How each pixel appears and disappears.                                                        |
| `pixel-shape`             | `'square' \| 'rounded' \| 'circle'`          | `'square'`  | Shape of the pixels while the transition runs. They merge into a solid cover at the midpoint. |
| `gap`                     | `number`                                     | `0`         | Space between pixels in px.                                                                   |
| `fps`                     | `number`                                     | `0`         | Caps how often the pixels redraw for a choppy retro feel. `0` redraws every frame.            |
| `trigger`                 | `'hover' \| 'click'`                         | `'hover'`   | What starts the transition.                                                                   |
| `active`                  | `boolean`                                    | —           | Controls the state from outside. Use with `v-model:active`.                                   |
| `once`                    | `boolean`                                    | `false`     | Keeps the second content once it has been revealed.                                           |
| `aspect-ratio`            | `string`                                     | `'100%'`    | Percentages work like padding-top (`'125%'`), anything else is a CSS ratio (`'4 / 5'`).       |
| `class`                   | `string`                                     | `''`        | Extra classes for the card (it is `w-75` by default).                                         |

## Events

| Event           | Payload           | Description                                                    |
| --------------- | ----------------- | -------------------------------------------------------------- |
| `update:active` | `active: boolean` | Fires when hover, focus or a click asks for the other content. |

## Slots

| Slot     | Description                        |
| -------- | ---------------------------------- |
| `first`  | Content shown by default.          |
| `second` | Content revealed by the transition |

## Accessibility

- The card is focusable. In hover mode, keyboard focus (`:focus-visible`) reveals the second content; in click mode it is a `role="button"` with `aria-pressed` and toggles on Enter or Space.
- The hidden layer uses `visibility: hidden`, so screen readers only read the visible content.
- With `prefers-reduced-motion: reduce` the swap happens in one frame without the pixel animation.

- Ported from [React Bits](https://reactbits.dev/animations/pixel-transition) by David Haz.
