---
title: Curved Loop
description: Looping marquee text that travels along an arc, a wave, a ring or a straight line, with drag-to-fling, outlined letters, accent separators and a scroll boost.
---

Text that loops forever along an SVG path. It can follow an arc, a wave, a closed ring or a straight line, and repeats can be joined by an accent mark in its own color. Drag the text to throw it — a ring follows the pointer around — and it glides back to its normal speed in whichever direction it was thrown. With a scroll boost, scrolling the page gives the loop a burst of speed that eases off. Pick a preset or tune it in the panel.

::demo-curved-loop
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/curved-loop.json"
```

## Usage

```vue
<script setup lang="ts">
  import CurvedLoop from '~/components/ui/curved-loop/CurvedLoop.vue';
</script>

<template>
  <CurvedLoop
    marquee-text="Scroll faster"
    shape="line"
    separator="/"
    separator-color="#ff5a1f"
    :speed="1"
    :scroll-boost="2"
    :font-size="136"
    :font-weight="800"
    :letter-spacing="-2"
    :edge-fade="0.4"
    outline
  />
</template>
```

The loop is drawn in a 1440px wide SVG view box and scales with its container, so `font-size` and `letter-spacing` are measured against that width. A ring always fits a whole number of repeats, so it never shows a seam.

## Props

| Prop              | Type                                    | Default          | Description                                                                                                         |
| ----------------- | --------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `marquee-text`    | `string`                                | `''`             | The text that loops along the path. Repeats are joined with a space                                                 |
| `shape`           | `'arc' \| 'wave' \| 'circle' \| 'line'` | `'arc'`          | The path the text travels on. Circle closes the loop into a ring that always fits a whole number of repeats         |
| `color`           | `string`                                | `'currentColor'` | Color of the text, or of its outline when outline is on. Follows the surrounding text color by default              |
| `separator`       | `string`                                | `''`             | A mark placed between repeats, such as ✦ or /. Leave empty to join repeats with a space                             |
| `separator-color` | `string`                                | —                | Paints the separator in its own solid color. Matches the text when unset                                            |
| `direction`       | `'left' \| 'right'`                     | `'left'`         | Which way the text travels. On a circle, right turns clockwise. A drag flips it to the way it was thrown            |
| `speed`           | `number`                                | `2`              | How fast the text travels along the path. `0` keeps it still until dragged or scrolled                              |
| `scroll-boost`    | `number`                                | `0`              | How much page scrolling speeds the loop up for a moment before it eases back. `0` turns it off                      |
| `curve-amount`    | `number`                                | `400`            | How far the path bends. On the arc it is the dip at the middle (negative arches up), on the wave it sets the height |
| `font-size`       | `number`                                | `96`             | Letter size in px for a 1440px wide loop. The whole loop scales with its container                                  |
| `font-weight`     | `number \| string`                      | `700`            | Weight of the letters                                                                                               |
| `letter-spacing`  | `number`                                | `0`              | Extra space between letters in px, measured like `font-size`                                                        |
| `edge-fade`       | `number`                                | `0`              | How much of each side fades out, from 0 to 1. At 1 only the middle stays fully visible                              |
| `outline`         | `boolean`                               | `false`          | Draws the letters as outlines instead of solid text                                                                 |
| `interactive`     | `boolean`                               | `true`           | Lets people drag the text and fling it. Rings follow the pointer around                                             |
| `pause-on-hover`  | `boolean`                               | `false`          | Eases the text to a stop while the pointer is over it                                                               |
| `class`           | `string`                                | `''`             | Classes merged onto the wrapper, for example to change the font                                                     |

## Accessibility

- The SVG has `role="img"` and an `aria-label` with the marquee text, so screen readers read it once instead of every repeat.
- When the user prefers reduced motion, the loop stays still; it can still be dragged.
- The loop pauses while it is off screen.

- Ported from [React Bits](https://reactbits.dev/text-animations/curved-loop) by David Haz.
