---
title: Scroll Based Velocity
description: Text marquee rows whose speed follows scroll velocity. Rows can lean and stretch with speed, be thrown with inertia and alternate with outlined text.
---

Rows of repeated text drift sideways, odd rows the other way. Scroll and they speed up in the direction you scroll, then ease back to their cruising pace. Rows can lean and stretch with speed, and with `draggable` you can grab a row, scrub it and throw it so it glides on. Scroll inside the demo, drag a row and try the presets in the panel.

::demo-scroll-based-velocity
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-based-velocity.json"
```

## Usage

```vue
<script setup lang="ts">
  import ScrollBasedVelocity from '~/components/ui/scroll-based-velocity/ScrollBasedVelocity.vue';
</script>

<template>
  <!-- "Skew" preset -->
  <ScrollBasedVelocity
    :texts="['Vue ✦ nxui', 'Scroll Down']"
    :velocity="70"
    :skew-with-velocity="16"
    :scale-with-velocity="0.18"
    :font-size="104"
    :font-weight="900"
    fade-edges
    draggable
  />
</template>
```

The rows follow the window scroll by default. Pass `scroll-container` to follow a scrolling element instead.

## Props

| Prop                  | Type                                    | Default                                | Description                                                                                   |
| --------------------- | --------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `texts`               | `string[]`                              | `[]`                                   | One row per entry. Odd rows run the other way.                                                |
| `velocity`            | `number`                                | `100`                                  | Base speed in px/s. The sign is flipped for odd rows.                                         |
| `color`               | `string`                                | —                                      | Text color. Follows the surrounding text color when left out.                                 |
| `font-size`           | `number \| string`                      | —                                      | Text size. Numbers are px. Left out, the rows use `text-4xl` / `5rem` on md screens.          |
| `font-weight`         | `number \| string`                      | —                                      | Text weight. Left out, the rows are bold.                                                     |
| `skew-with-velocity`  | `number`                                | `0`                                    | How far the rows lean into their motion at full speed, in degrees. Eases back when they slow. |
| `scale-with-velocity` | `number`                                | `0`                                    | How much the rows stretch taller at full speed, as a fraction. Negative values squash them.   |
| `draggable`           | `boolean`                               | `false`                                | Grab a row to scrub it, then throw it to glide on with inertia.                               |
| `outline-alternate`   | `boolean`                               | `false`                                | Draws every other row as outlined text.                                                       |
| `gap`                 | `number`                                | `0`                                    | Extra space between copies in px, split evenly around the separator.                          |
| `separator`           | `string`                                | `''`                                   | Shown between the copies, like a dot or a slash. Empty leaves a space.                        |
| `fade-edges`          | `boolean`                               | `false`                                | Softly fades the rows out at the left and right edges.                                        |
| `pause-on-hover`      | `boolean`                               | `false`                                | Glides the rows to a stop while the pointer is over them.                                     |
| `num-copies`          | `number`                                | `6`                                    | Copies rendered per row for a seamless loop.                                                  |
| `damping`             | `number`                                | `50`                                   | Damping of the scroll-velocity spring.                                                        |
| `stiffness`           | `number`                                | `400`                                  | Stiffness of the scroll-velocity spring.                                                      |
| `velocity-mapping`    | `{ input: number[]; output: number[] }` | `{ input: [0, 1000], output: [0, 5] }` | Maps scroll velocity (px/s) to a movement multiplier. Not clamped.                            |
| `scroll-container`    | `HTMLElement \| null`                   | `null`                                 | Scrolling element to follow. Defaults to the window.                                          |
| `text-class`          | `string`                                | `''`                                   | Classes on each repeated text copy.                                                           |
| `parallax-class`      | `string`                                | `''`                                   | Extra classes on each row's clipping container.                                               |
| `scroller-class`      | `string`                                | `''`                                   | Extra classes on each row's moving track.                                                     |
| `parallax-style`      | `StyleValue`                            | —                                      | Inline styles on each row's clipping container.                                               |
| `scroller-style`      | `StyleValue`                            | —                                      | Inline styles on each row's moving track.                                                     |
| `class`               | `string`                                | `''`                                   | Extra classes on the root.                                                                    |

## Accessibility

- Only the first copy in each row is read by screen readers; the repeats are `aria-hidden`.
- With `prefers-reduced-motion: reduce` the rows stand still. Dragging still works.
- Each row stops its animation loop while it is off screen.
- A drag of more than a few pixels swallows the click that follows, so links inside a row are not opened by accident.

- Ported from [React Bits](https://reactbits.dev/text-animations/scroll-velocity) by David Haz.
