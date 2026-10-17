---
title: Cursor Grid
description: A crisp grid whose cells light up and fade behind the cursor, with grid styles, tiles and click pulses.
---

A WebGL 2 grid that reacts to the cursor. Move the pointer over it and the cells near the cursor light up, hold for a moment, then fade. The grid lines brighten in a soft spotlight around the pointer. Click to send a ring of lit cells out from the click. Use the controls to try the presets: Minimal, Cell, Tiles, Marks, Dots, Dashed and Classic.

::demo-cursor-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/cursor-grid.json"
```

## Usage

```vue
<script setup lang="ts">
  import CursorGrid from '~/components/ui/cursor-grid/CursorGrid.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden rounded-lg bg-zinc-950">
    <CursorGrid
      color="#7dd3fc"
      highlight="cell"
      :cell-gap="4"
      :cell-radius="10"
      :fill-opacity="0.14"
      :grid-opacity="0.05"
      :fade-duration="1200"
    >
      <h2 class="grid size-full place-items-center text-3xl text-white">
        Hover me
      </h2>
    </CursorGrid>
  </div>
</template>
```

The grid fills its parent, so give the parent a size. Content in the default slot is drawn above the grid, and the grid keeps reacting to the cursor underneath it. Set `cell-gap` or `cell-radius` above 0 to draw lit cells as separate tiles. On a light page, set `light-mode` so the default colors are near black.

## Props

| Prop            | Type                                         | Default     | Description                                                                                |
| --------------- | -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `color`         | `string`                                     | `'#ffffff'` | Color of lit cells and pulses. Defaults to near black in light mode.                       |
| `grid-color`    | `string`                                     | `'#ffffff'` | Color of the grid lines. Defaults to near black in light mode.                             |
| `cell-size`     | `number`                                     | `60`        | Size of each grid cell, in px.                                                             |
| `highlight`     | `'area' \| 'cell'`                           | `'area'`    | Light every cell within the radius around the cursor, or only the cell under it.           |
| `grid-style`    | `'lines' \| 'dashed' \| 'dots' \| 'crosses'` | `'lines'`   | How the grid is drawn: solid lines, dashed lines, dots or plus marks where the lines meet. |
| `radius`        | `number`                                     | `140`       | Reach of the cursor, in px, for both the lit area and the spotlight.                       |
| `falloff`       | `'smooth' \| 'linear' \| 'sharp'`            | `'smooth'`  | How quickly cells dim toward the edge of the radius.                                       |
| `hold-time`     | `number`                                     | `400`       | How long a cell stays lit before fading, in ms.                                            |
| `fade-duration` | `number`                                     | `800`       | How long a lit cell takes to fade out, in ms.                                              |
| `line-width`    | `number`                                     | `1`         | Width of the grid lines, in px.                                                            |
| `max-opacity`   | `number`                                     | `1`         | Brightness of a fully lit cell outline.                                                    |
| `fill-opacity`  | `number`                                     | `0.06`      | Soft fill inside lit cells.                                                                |
| `grid-opacity`  | `number`                                     | `0.08`      | Opacity of the grid lines at rest. `0` shows only lit cells.                               |
| `spotlight`     | `number`                                     | `0.6`       | How much the grid lines brighten around the cursor, from 0 to 1.                           |
| `cell-gap`      | `number`                                     | `0`         | Inset of lit cells, in px. Above 0, lit cells become separate tiles.                       |
| `cell-radius`   | `number`                                     | `0`         | Corner radius of lit tiles, in px.                                                         |
| `click-pulse`   | `boolean`                                    | `true`      | Clicking sends a ring of lit cells out from the click.                                     |
| `pulse-speed`   | `number`                                     | `600`       | Speed of the click ring, in px per second.                                                 |
| `ambient`       | `number`                                     | `0`         | Lets random cells glow softly on their own, from 0 to 1.                                   |
| `edge-fade`     | `number`                                     | `0.2`       | Fades the grid out toward the edges, from 0 to 0.5.                                        |
| `intro`         | `boolean`                                    | `true`      | Draws the grid out from the center with a pulse on mount.                                  |
| `light-mode`    | `boolean`                                    | `false`     | Uses near black lines and cells by default, for light pages.                               |
| `dpr`           | `number`                                     | `auto`      | Maximum device pixel ratio, capped at 2.                                                   |
| `class`         | `string`                                     | `''`        | Extra classes for the root element.                                                        |
| `style`         | `StyleValue`                                 | `-`         | Inline styles for the root element.                                                        |

## Slots

| Name      | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| `default` | Content drawn above the grid. The grid keeps reacting to the cursor underneath it. |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Slot content stays in the normal reading order.
- With `prefers-reduced-motion: reduce`, the intro, the click pulses and the ambient glow are off. Cells still light under the cursor.
- The render loop sleeps when nothing moves, and stops while the grid is offscreen or the tab is hidden. The WebGL 2 context is released on unmount.
- The component needs WebGL 2. Without it, only the slot content renders.

- Ported from [React Bits](https://reactbits.dev/animations/cursor-grid) by David Haz.
