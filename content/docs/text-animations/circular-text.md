---
title: Circular Text
description: Text laid out around a spinning ring that reacts to hover, can be flung with inertia, tilts toward the cursor in 3D and holds an icon in the middle.
---

Circular Text sets a line of text around a ring that keeps turning. Hover it and it eases into a new speed: slower, faster, paused or wildly fast. With `draggable` you can grab the ring and fling it; it coasts, then settles back to its cruising speed. It can lean toward the cursor in 3D, sit back in perspective like a planet's orbit, draw an inner circle, keep natural letter spacing with gaps between copies, and hold any content in the middle. Hover, drag and try the presets in the panel.

::demo-circular-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/circular-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import CircularText from '~/components/ui/circular-text/CircularText.vue';
</script>

<template>
  <!-- "Stamp" preset -->
  <CircularText
    text="made with care • since 2026 • "
    color="#e5484d"
    on-hover="slowDown"
    direction="counterclockwise"
    :spin-duration="30"
    :hover-tilt="12"
    :size="220"
    :font-size="17"
    :font-weight="700"
    :letter-spacing="0.02"
    :repeat="2"
    :fill="false"
    ring
    draggable
  >
    <Icon name="lucide:star" class="size-12 fill-current" />
  </CircularText>
</template>
```

## Props

| Prop             | Type                                                        | Default       | Description                                                                                         |
| ---------------- | ----------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `text`           | `string`                                                    | —             | Text laid out around the ring. End it with a separator for a seamless loop.                         |
| `spin-duration`  | `number`                                                    | `20`          | Seconds for one full turn. `0` keeps the ring still until it is dragged.                            |
| `on-hover`       | `'slowDown' \| 'speedUp' \| 'pause' \| 'goBonkers' \| null` | `'speedUp'`   | What happens while the pointer is over the ring. It eases in and out; `goBonkers` also shrinks it.  |
| `direction`      | `'clockwise' \| 'counterclockwise'`                         | `'clockwise'` | Which way the ring turns.                                                                           |
| `draggable`      | `boolean`                                                   | `false`       | Grab the ring and fling it. It coasts with inertia, then eases back to its cruise speed.            |
| `hover-tilt`     | `number`                                                    | `0`           | How far the ring tilts in 3D toward the pointer, in degrees. `0` turns it off.                      |
| `tilt`           | `number`                                                    | `0`           | Leans the ring back in perspective, in degrees, so it orbits the center content like a planet ring. |
| `size`           | `number`                                                    | `200`         | Diameter of the ring in px.                                                                         |
| `font-size`      | `number`                                                    | `24`          | Letter size in px.                                                                                  |
| `font-weight`    | `number`                                                    | `900`         | Letter weight.                                                                                      |
| `letter-spacing` | `number`                                                    | `0`           | Extra space between letters, in em. Applies when `fill` is off.                                     |
| `color`          | `string`                                                    | `''`          | Color of the letters and center content. Empty follows the surrounding text color.                  |
| `start-angle`    | `number`                                                    | `0`           | Where the first letter sits, in degrees clockwise from the top.                                     |
| `fill`           | `boolean`                                                   | `true`        | Spreads the letters evenly around the ring. Turn it off to keep natural spacing and leave a gap.    |
| `repeat`         | `number`                                                    | `1`           | How many times the text repeats. With `fill` off, each copy gets its own gap.                       |
| `ring`           | `boolean`                                                   | `false`       | Draws a thin circle just inside the letters.                                                        |
| `ring-color`     | `string`                                                    | `''`          | Color of the inner circle. Empty matches the letters.                                               |
| `class`          | `string`                                                    | `''`          | Extra classes on the root.                                                                          |

## Slots

| Slot      | Description                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------- |
| `default` | Content shown in the middle of the ring, such as an icon or a short label. It tilts with the ring. |

## Accessibility

- The ring is `role="img"` with the text as its `aria-label`, so screen readers read the phrase once instead of letter by letter.
- With `prefers-reduced-motion: reduce` the ring stays still, hover speed changes and tilt are off, and a drag does not fling.
- The spin loop stops while the ring is off screen.

- Ported from [React Bits](https://reactbits.dev/text-animations/circular-text) by David Haz.
