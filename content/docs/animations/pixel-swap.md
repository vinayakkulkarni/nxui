---
title: Pixel Swap
description: New content builds in pixel by pixel in a springy wave that starts wherever the cursor enters.
---

Swaps between two pieces of content with a springy wave of pixels. Hover the card and the second image builds in from the point where the cursor enters; move away and it retreats from where you left. Switch `trigger` to `click` to toggle on click, or drive it yourself with `v-model:active`.

::demo-pixel-swap
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-swap.json"
```

## Usage

```vue
<script setup lang="ts">
  import PixelSwap from '~/components/ui/pixel-swap/PixelSwap.vue';
</script>

<template>
  <PixelSwap
    class="max-w-140 rounded-2xl"
    pattern="pointer"
    :pixel-size="48"
    :duration="400"
    :pixel-duration="350"
    :randomness="0.2"
    :bounce="0.3"
    trigger="hover"
    intro
  >
    <template #first>
      <img src="/day-sky.webp" alt="" class="size-full object-cover" />
    </template>
    <template #second>
      <img src="/night-sky.webp" alt="" class="size-full object-cover" />
    </template>
  </PixelSwap>
</template>
```

## Props

| Prop             | Type                                                                                                                                                 | Default     | Description                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `pattern`        | `'pointer' \| 'random' \| 'center' \| 'edges' \| 'left-to-right' \| 'right-to-left' \| 'top-to-bottom' \| 'bottom-to-top' \| 'diagonal' \| 'spiral'` | `'pointer'` | Order the pixels arrive in. Pointer starts the wave where the cursor enters, leaves or clicks. |
| `pixel-size`     | `number`                                                                                                                                             | `48`        | Edge length of each pixel in px. Grows automatically when the grid would pass 600 pixels.      |
| `gap`            | `number`                                                                                                                                             | `0`         | Space between pixels in px while they grow.                                                    |
| `pixel-radius`   | `number`                                                                                                                                             | `0`         | Corner rounding of the pixels while they grow, as a percentage. 50 starts them as dots.        |
| `pixel-scale`    | `number`                                                                                                                                             | `0`         | Size each pixel pops in at, from 0 to grow out of nothing to 0.9 for a hard pop.               |
| `pixel-spin`     | `number`                                                                                                                                             | `0`         | Degrees each pixel turns as it grows in.                                                       |
| `duration`       | `number`                                                                                                                                             | `400`       | Time in ms the wave takes to cross the content.                                                |
| `pixel-duration` | `number`                                                                                                                                             | `350`       | Time in ms a single pixel takes to grow.                                                       |
| `randomness`     | `number`                                                                                                                                             | `0.2`       | Noise mixed into the pattern, from 0 for a clean wave to 1 for a scatter.                      |
| `bounce`         | `number`                                                                                                                                             | `0.3`       | How far each pixel overshoots before it settles, from 0 to 1.                                  |
| `trigger`        | `'hover' \| 'click' \| 'none'`                                                                                                                       | `'hover'`   | What starts the swap. With `none`, drive it with `active`.                                     |
| `intro`          | `boolean`                                                                                                                                            | `true`      | Builds the first content in from pixels on mount.                                              |
| `initial-active` | `boolean`                                                                                                                                            | `false`     | Starts on the second content.                                                                  |
| `active`         | `boolean`                                                                                                                                            | `undefined` | Controls which content shows. Use `v-model:active`, or pair it with `update:active`.           |
| `aspect-ratio`   | `string`                                                                                                                                             | `'16 / 10'` | Aspect ratio of the root.                                                                      |
| `class`          | `string`                                                                                                                                             | `''`        | Extra classes for the root element.                                                            |

## Slots

| Slot     | Description                            |
| -------- | -------------------------------------- |
| `first`  | Content shown at rest.                 |
| `second` | Content that builds in pixel by pixel. |

## Events

| Event           | Type                | Description                                                                                   |
| --------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `update:active` | `(active: boolean)` | Fired when the trigger asks to swap. In controlled mode nothing moves until `active` changes. |
| `complete`      | `(active: boolean)` | Fired when a swap finishes.                                                                   |

## Accessibility

- With `trigger="click"` the root is a focusable button (`role="button"`, `tabindex="0"`, `aria-pressed`) that responds to Enter and Space.
- With `trigger="hover"` the root is focusable: keyboard focus shows the second content and blur shows the first. A tap toggles it on touch screens.
- The root shows a visible focus ring (`outline: 2px solid currentColor`).
- With `prefers-reduced-motion: reduce` the swap is skipped and content switches instantly.
- Each layer is hidden with `visibility: hidden` when inactive and marked `aria-hidden`.

- Ported from [React Bits](https://reactbits.dev/animations/pixel-swap) by David Haz.
