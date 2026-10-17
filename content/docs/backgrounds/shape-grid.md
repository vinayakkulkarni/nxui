---
title: Shape Grid
description: A drifting grid of shapes that lights up under the cursor, with eight cell shapes, perspective tilt, rainbow trails and click ripples.
---

A drifting grid of shapes that lights up under the cursor. Pick from eight cell shapes, tilt the grid into perspective, or light it in rainbow colors. On mount the grid draws in from the middle; move the pointer to leave a glowing trail, and click to send a ring of lit cells rolling out across it.

::demo-shape-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shape-grid.json"
```

## Usage

```vue
<script setup lang="ts">
  import ShapeGrid from '~/components/ui/shape-grid/ShapeGrid.vue';
</script>

<template>
  <div class="relative h-130 w-full overflow-hidden">
    <ShapeGrid
      shape="hexagon"
      direction="up"
      line-color="#2a2734"
      hover-color="#2dd4bf"
      :speed="0.35"
      :radius="2"
      :tilt-x="20"
      click-cascade
    />
  </div>
</template>
```

## Props

| Prop               | Type                                                                                         | Default         | Description                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `shape`            | `'square' \| 'tile' \| 'hexagon' \| 'triangle' \| 'diamond' \| 'circle' \| 'cross' \| 'dot'` | `'square'`      | Shape of the cells. Cross and dot draw markers where the grid lines would meet.               |
| `cell-size`        | `number`                                                                                     | `40`            | Size of each cell, in px.                                                                     |
| `line-width`       | `number`                                                                                     | `1`             | Thickness of the grid lines, in px.                                                           |
| `direction`        | `'diagonal' \| 'up' \| 'down' \| 'left' \| 'right' \| 'none'`                                | `'diagonal'`    | Which way the grid drifts. `'none'` holds it still.                                           |
| `speed`            | `number`                                                                                     | `0.5`           | How fast the grid drifts.                                                                     |
| `line-color`       | `string`                                                                                     | `'#2a2734'`     | Color of the grid lines.                                                                      |
| `hover-color`      | `string`                                                                                     | `'#ffffff'`     | Color the cell borders light up in under the cursor.                                          |
| `hover-fill-color` | `string`                                                                                     | `hover-color`   | Color that fills the inside of lit cells. Follows `hover-color` when not set.                 |
| `fill-opacity`     | `number`                                                                                     | `0.15`          | How solid the inside of lit cells gets, from 0 for outlines only to 1 for solid cells.        |
| `rainbow`          | `boolean`                                                                                    | `false`         | Lights cells in shifting rainbow colors instead of the hover color.                           |
| `tilt-x`           | `number`                                                                                     | `0`             | Tilts the grid back in perspective, in degrees. Positive values push the top away.            |
| `tilt-y`           | `number`                                                                                     | `0`             | Turns the grid sideways in perspective, in degrees. Positive values push the right side away. |
| `radius`           | `number`                                                                                     | `1.5`           | Size of the light around the cursor, in cells. `0` lights only the cell under it.             |
| `trail`            | `number`                                                                                     | `0.6`           | How long lit cells take to fade after the cursor moves on, in seconds.                        |
| `glow`             | `number`                                                                                     | `0.35`          | Soft glow around lit cells, from 0 to 1.                                                      |
| `twinkle`          | `number`                                                                                     | `0`             | Lets random cells light up on their own now and then, from 0 to 1.                            |
| `fade`             | `number`                                                                                     | `1`             | Fades the grid out toward the edges, from 0 to 1.                                             |
| `click-cascade`    | `boolean`                                                                                    | `true`          | Clicking sends a ring of lit cells rolling out across the grid.                               |
| `intro`            | `boolean`                                                                                    | `true`          | Draws the grid in from the middle when it first appears.                                      |
| `opacity`          | `number`                                                                                     | `1`             | Opacity of the whole grid.                                                                    |
| `background-color` | `string`                                                                                     | `'transparent'` | Color behind the grid. The canvas is transparent by default.                                  |
| `paused`           | `boolean`                                                                                    | `false`         | Freezes the drift and the lights.                                                             |
| `dpr`              | `number`                                                                                     | auto            | Device pixel ratio for the canvas. Defaults to the screen's, capped at 2.                     |
| `class`            | `string`                                                                                     | `''`            | Extra classes for the container.                                                              |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Put real content above it.
- With `prefers-reduced-motion: reduce`, the grid stops drifting and the intro and twinkle are off; cells still light up under the pointer.
- The animation pauses when the grid is off screen, and stops once a still grid has no lit cells.
- Pointer input is read from the window, so the grid can sit under other content and still react.

- Ported from [React Bits](https://reactbits.dev/backgrounds/shape-grid) by David Haz.
