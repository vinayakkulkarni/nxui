---
title: Cubes
description: A grid of outlined 3D cubes that turn to face the cursor, spin when swept and ripple on click, drawn with instanced WebGL2.
---

A grid of outlined 3D cubes on springs. Cubes near the cursor turn to face it, a fast sweep spins the cubes it passes over, and a click sends a ripple through the grid that lights up their edges. On mount the cubes tumble into place from the center, and while the cursor is away a gentle wave drifts across the grid. Everything is one instanced WebGL2 draw, and the loop sleeps when the cubes settle.

::demo-cubes
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/cubes.json"
```

## Usage

The grid fills its parent and stays square, centered on the shorter side.

```vue
<script setup lang="ts">
  import Cubes from '~/components/ui/cubes/Cubes.vue';
</script>

<template>
  <div class="relative h-150 w-full">
    <Cubes
      :grid-size="10"
      :gap="0.18"
      face-color="#120F17"
      edge-color="#ffffff"
      edge-style="dashed"
      :max-angle="45"
      :radius="3"
      ripple-color="#ffffff"
    />
  </div>
</template>
```

## Props

| Prop              | Type                                        | Default     | Description                                                                     |
| ----------------- | ------------------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| `grid-size`       | `number`                                    | `10`        | Number of cubes on each side of the grid (1 to 40).                             |
| `gap`             | `number`                                    | `0.18`      | Space between cubes, as a fraction of a cell.                                   |
| `face-color`      | `string`                                    | `'#120F17'` | Color of the cube faces. Match it to your page background for a clean cut-out.  |
| `edge-color`      | `string`                                    | `'#ffffff'` | Color of the cube outlines.                                                     |
| `edge-width`      | `number`                                    | `1`         | Width of the outlines in px.                                                    |
| `edge-style`      | `'solid' \| 'dashed' \| 'dotted' \| 'none'` | `'solid'`   | How the cube outlines are drawn.                                                |
| `face-opacity`    | `number`                                    | `1`         | Opacity of the faces, from 0 for see-through wireframes to 1 for solid cubes.   |
| `shading`         | `number`                                    | `0.6`       | How much the sides of turned cubes pick up light, so they read as solid shapes. |
| `max-angle`       | `number`                                    | `45`        | How far cubes turn to face the cursor, in degrees.                              |
| `radius`          | `number`                                    | `3`         | How far the cursor reaches, in cubes.                                           |
| `speed`           | `number`                                    | `1`         | How quickly cubes respond.                                                      |
| `bounce`          | `number`                                    | `0.4`       | How much cubes overshoot and wobble as they settle, from 0 to 1.                |
| `brush`           | `number`                                    | `1`         | How strongly fast cursor sweeps spin the cubes they pass over.                  |
| `perspective`     | `number`                                    | `0`         | Camera perspective, from 0 for a flat front view to 1 for strong depth.         |
| `auto-animate`    | `boolean`                                   | `true`      | Drifts a gentle wave across the grid while the cursor is away.                  |
| `ripple-on-click` | `boolean`                                   | `true`      | Clicking sends a ripple through the cubes that lights up their edges.           |
| `ripple-color`    | `string`                                    | `'#ffffff'` | Color the ripple lights the cubes with.                                         |
| `ripple-speed`    | `number`                                    | `1`         | Speed of the ripple.                                                            |
| `intro`           | `boolean`                                   | `true`      | Cubes tumble into place from the center on mount.                               |
| `paused`          | `boolean`                                   | `false`     | Freezes the animation.                                                          |
| `dpr`             | `number`                                    | auto        | Maximum device pixel ratio, capped at 2.                                        |
| `class`           | `string`                                    | `''`        | Extra classes for the container.                                                |

## Accessibility

- The canvas is decorative (`aria-hidden="true"`). Put any meaningful content in regular markup next to or over it.
- With `prefers-reduced-motion: reduce` there is no intro, no idle wave, no sweep spin and no ripple; cubes still turn toward the cursor, without spring wobble.
- `touch-action: pan-y` keeps vertical page scrolling on touch screens. The loop stops when the cubes settle, when the grid is offscreen and when the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/animations/cubes) by David Haz.
