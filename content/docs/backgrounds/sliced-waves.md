---
title: Sliced Waves
description: Waves of colored light sliced into glowing bars, seen in depth with a focus that follows the cursor.
---

A WebGL2 background of colored light waves cut into a row of glowing bars that curve away in depth. The bars grow in across the view on mount, overlapping light burns to white, and moving the cursor over the bars pulls the depth-of-field focus to them and lights them up.

::demo-sliced-waves
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/sliced-waves.json"
```

## Usage

```vue
<script setup lang="ts">
  import SlicedWaves from '~/components/ui/sliced-waves/SlicedWaves.vue';
</script>

<template>
  <div class="relative h-125 w-full">
    <SlicedWaves color1="#ffd9a8" color2="#ff5fa2" color3="#5b8cff" />
  </div>
</template>
```

## Props

| Prop                | Type      | Default            | Description                                                                        |
| ------------------- | --------- | ------------------ | ---------------------------------------------------------------------------------- |
| `color1`            | `string`  | `'#ffd9a8'`        | First color of the light.                                                          |
| `color2`            | `string`  | `'#ff5fa2'`        | Second color of the light.                                                         |
| `color3`            | `string`  | `'#5b8cff'`        | Third color of the light.                                                          |
| `ribbons`           | `number`  | `3`                | Number of waves of light, from 1 to 6.                                             |
| `spacing`           | `number`  | `28`               | Distance between the bars in the middle of the view, in px.                        |
| `bar-width`         | `number`  | `0.5`              | Width of each bar, as a share of the spacing.                                      |
| `ribbon-height`     | `number`  | `0.26`             | Height of each wave, as a fraction of the view height.                             |
| `spread`            | `number`  | `0.1`              | Vertical distance between the waves, as a fraction of the view height.             |
| `amplitude`         | `number`  | `0.1`              | How far the waves rise and fall, as a fraction of the view height.                 |
| `frequency`         | `number`  | `1`                | How many waves fit across the view.                                                |
| `speed`             | `number`  | `1`                | Animation speed. Negative values reverse the waves.                                |
| `perspective`       | `number`  | `0.45`             | How much the strip of bars turns away from you, from 0 to 1.                       |
| `curve`             | `number`  | `0.5`              | How much the strip bends in depth, from 0 to 1.                                    |
| `blur`              | `number`  | `0.6`              | Depth of field. Bars away from the focus soften, and the focus follows the cursor. |
| `glow`              | `number`  | `1`                | Strength of the soft light around each bar.                                        |
| `brightness`        | `number`  | `1.25`             | Overall brightness. Where waves overlap, the light burns to white.                 |
| `position`          | `number`  | `0.78`             | Vertical position of the waves, from 0 at the top to 1 at the bottom.              |
| `rotation`          | `number`  | `0`                | Rotation of the whole effect, in degrees.                                          |
| `slices`            | `number`  | `0`                | Cuts the bars into segments like an LED display. 0 keeps them solid.               |
| `grain`             | `number`  | `0.08`             | Strength of the film grain.                                                        |
| `mouse-interaction` | `boolean` | `true`             | Pulls the focus to the bars under the cursor and lights them up.                   |
| `intro`             | `boolean` | `true`             | Grows the bars in across the view on mount.                                        |
| `fade`              | `number`  | `0`                | Fades the edges into the page, from 0 to 1.                                        |
| `opacity`           | `number`  | `1`                | Opacity of the whole effect.                                                       |
| `light-mode`        | `boolean` | `false`            | Draws the bars as colored ink for light backgrounds.                               |
| `paused`            | `boolean` | `false`            | Freezes the animation.                                                             |
| `dpr`               | `number`  | `devicePixelRatio` | Maximum device pixel ratio, capped at 2.                                           |
| `class`             | `string`  | `''`               | Additional CSS classes for the container.                                          |

## Accessibility

The canvas is decorative and hidden from assistive technology (`aria-hidden`). With `prefers-reduced-motion: reduce` the waves hold still, the intro is skipped and the cursor focus is off. The render loop stops when the component is offscreen or the tab is hidden, and goes idle once the animation is paused and the focus has settled.

- Ported from [React Bits](https://reactbits.dev/backgrounds/sliced-waves) by David Haz.
