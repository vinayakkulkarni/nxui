---
title: Ripple Grid
description: A crisp grid that ripples like water, bending and lighting up as waves pass through it, with dot, cross and perspective-floor styles.
---

A crisp grid drawn in raw WebGL2 that ripples like water. Real waves travel outward from the center (or from random spots), bending the lines and lighting them up as each crest passes. Move the cursor and it leaves a wake of small ripples and lights the lines nearby; click to send a strong ripple. Draw it as lines, dots or small crosses, tilt it back into a perspective floor, or switch on light mode for light backgrounds. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-ripple-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ripple-grid.json"
```

## Usage

```vue
<script setup lang="ts">
  import RippleGrid from '~/components/ui/ripple-grid/RippleGrid.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <RippleGrid
      color="#ffffff"
      variant="lines"
      :cell-size="48"
      :glow="0.6"
      auto-ripple="center"
      :ripple-interval="2.6"
      :fade="0.5"
      :click-ripple="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `rippleGridPreset('floor')` returns the grid shape of the Pulse, Floor, Dots, Cross or Calm preset. Color is left to you.

## Props

| Prop                | Type                             | Default     | Description                                                                |
| ------------------- | -------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `color`             | `string`                         | `'#ffffff'` | Color of the grid. Light mode derives its ink from it.                     |
| `variant`           | `'lines' \| 'dots' \| 'cross'`   | `'lines'`   | Draws the grid as lines, dots at each crossing, or small crosses.          |
| `cell-size`         | `number`                         | `48`        | Size of each grid cell, in px.                                             |
| `line-width`        | `number`                         | `1`         | Width of the lines, in px.                                                 |
| `glow`              | `number`                         | `0.6`       | Soft glow around the lines.                                                |
| `ripple-strength`   | `number`                         | `1`         | How far ripples bend the grid and how brightly their crests light it.      |
| `ripple-speed`      | `number`                         | `1`         | How fast ripples travel outward.                                           |
| `ripple-size`       | `number`                         | `1`         | Wavelength of the ripples.                                                 |
| `auto-ripple`       | `'center' \| 'random' \| 'none'` | `'center'`  | Where idle ripples start: from the center, at random spots, or not at all. |
| `ripple-interval`   | `number`                         | `2.6`       | Seconds between idle ripples.                                              |
| `tilt`              | `number`                         | `0`         | Lays the grid back in perspective, like a floor, in degrees.               |
| `rotation`          | `number`                         | `0`         | Turns the grid, in degrees.                                                |
| `mouse-interaction` | `boolean`                        | `true`      | The cursor leaves a wake of small ripples and lights up the lines nearby.  |
| `click-ripple`      | `boolean`                        | `true`      | Clicking sends a strong ripple.                                            |
| `intro`             | `boolean`                        | `true`      | Reveals the grid with a ripple from the center.                            |
| `fade`              | `number`                         | `0.5`       | Fades the edges into the page, from 0 to 1.                                |
| `opacity`           | `number`                         | `1`         | Opacity of the whole effect.                                               |
| `light-mode`        | `boolean`                        | `false`     | Draws the grid as ink for light backgrounds.                               |
| `paused`            | `boolean`                        | `false`     | Freezes the animation.                                                     |
| `dpr`               | `number`                         | auto        | Maximum device pixel ratio, capped at 2.                                   |
| `class`             | `string`                         | `''`        | Extra classes merged on the container.                                     |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it and check its contrast against your grid color.
- Pointer listeners are passive and sit on `window`, so the grid never takes focus or blocks clicks on content above it.
- With `prefers-reduced-motion: reduce` there is no intro, idle ripple, cursor wake or click ripple. The grid is drawn and holds still.
- The render loop stops when the grid is paused and settled, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/ripple-grid) by David Haz.
