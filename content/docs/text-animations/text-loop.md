---
title: Text Loop
description: A seamless text marquee that flows along a curved SVG path — wave, circle, infinity, arch or line — with an optional crossing band, drag-to-fling and scroll boost.
---

A phrase repeats along an SVG curve and scrolls without a seam. Hover to ease it to a stop, turn on `draggable` to scrub or throw it (it spins on a circle), and set `scroll-boost` so page scrolling speeds it up or reverses it. `cross` adds a second band running the other way with a soft shadow where they overlap.

::demo-text-loop
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-loop.json"
```

## Usage

```vue
<script setup lang="ts">
  import TextLoop from '~/components/ui/text-loop/TextLoop.vue';
</script>

<template>
  <TextLoop
    text="React ✦ Bits"
    shape="line"
    ribbon-color="#ff5a36"
    color="#120f17"
    :speed="120"
    :ribbon-width="76"
    cross
    :cross-angle="14"
    draggable
  />
</template>
```

The repetition count is measured from the rendered text, so the loop always
fills the curve exactly; two copies of the run, offset by one path length,
make the wrap invisible.

## Props

| Prop             | Type                                                   | Default        | Description                                                                                    |
| ---------------- | ------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------- |
| `text`           | `string`                                               | `'Vue ✦ nxui'` | The phrase repeated along the curve                                                            |
| `shape`          | `'wave' \| 'circle' \| 'infinity' \| 'arch' \| 'line'` | `'wave'`       | Built-in curve the text flows along                                                            |
| `path`           | `string`                                               | —              | Custom SVG path data in a 1200×520 viewBox; overrides `shape`                                  |
| `speed`          | `number`                                               | `90`           | Travel speed along the path, in units per second                                               |
| `direction`      | `'forward' \| 'reverse'`                               | `'forward'`    | Direction the text scrolls                                                                     |
| `separator`      | `string`                                               | `'✦'`          | Glyph placed between repetitions                                                               |
| `curviness`      | `number`                                               | `90`           | Wave amplitude, or radius of the closed shapes                                                 |
| `tilt`           | `number`                                               | `0`            | Rotates the whole loop, in degrees                                                             |
| `cross`          | `boolean`                                              | `false`        | Adds a second band crossing the first and running the other way                                |
| `cross-color`    | `string`                                               | —              | Crossing band color; defaults to a pale tint of `ribbon-color` (text without a ribbon, dimmed) |
| `cross-angle`    | `number`                                               | `16`           | Angle between the two bands, centered on `tilt`                                                |
| `draggable`      | `boolean`                                              | `false`        | Drag to scrub (or spin on a circle); a throw keeps momentum, then eases back                   |
| `scroll-boost`   | `number`                                               | `0`            | How strongly page scrolling pushes the loop; `0` turns it off                                  |
| `font-size`      | `number`                                               | `46`           | Font size of the looping text                                                                  |
| `font-weight`    | `number`                                               | `800`          | Font weight of the looping text                                                                |
| `letter-spacing` | `number`                                               | `2`            | Extra tracking between letters                                                                 |
| `uppercase`      | `boolean`                                              | `true`         | Renders the phrase in uppercase                                                                |
| `outline`        | `boolean`                                              | `false`        | Draws the letters as outlines                                                                  |
| `outline-width`  | `number`                                               | `1.5`          | Stroke width of outlined letters                                                               |
| `color`          | `string`                                               | —              | Text fill; white on the ribbon, `currentColor` without it                                      |
| `ribbon`         | `boolean`                                              | `true`         | Draws a solid band behind the text                                                             |
| `ribbon-color`   | `string`                                               | `'#5227FF'`    | Color of the band                                                                              |
| `ribbon-width`   | `number`                                               | `86`           | Thickness of the band                                                                          |
| `edge-fade`      | `number`                                               | `0`            | Fades the loop toward the left and right edges, from `0` (hard) to `1` (wide)                  |
| `pause-on-hover` | `boolean`                                              | `true`         | Eases the loop to a stop while hovered, and back up to speed on leave                          |
| `class`          | `string`                                               | —              | Additional classes on the root element                                                         |

## Accessibility

- The SVG has `role="img"` and an `aria-label` set to `text`; the repeated runs are `aria-hidden`.
- With `prefers-reduced-motion: reduce` the loop does not auto-scroll and drags don't fling; dragging still scrubs.
- Animation pauses while the loop is off screen.

- Ported from [React Bits](https://reactbits.dev/text-animations/text-loop) by David Haz.
