---
title: AcidSquares
description: A rolling field of glossy squares that ripples under two drifting colored lights.
---

A WebGL field of glossy, bevelled squares that rolls in slow swells while ripples travel out across it under two drifting colored lights. Move the cursor over it to press (or lift) the surface, and click anywhere to send a ripple out from that spot.

::demo-acid-squares
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/acid-squares.json"
```

## Usage

```vue
<script setup lang="ts">
  import AcidSquares from '~/components/ui/acid-squares/AcidSquares.vue';
</script>

<template>
  <div class="relative h-screen w-full bg-[#120f17]">
    <AcidSquares
      color="#120f17"
      accent-color="#ff4fb8"
      secondary-color="#3b6bff"
      :tile-size="1"
      :rotation="35"
      lighting="split"
      hover-effect="press"
    />
  </div>
</template>
```

Set `color` to your page background: the gaps between the squares are transparent and show the page through. On light pages, turn on `light-mode` and use a pale `color`.

## Props

| Prop                | Type                                 | Default     | Description                                                                                |
| ------------------- | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------ |
| `color`             | `string`                             | `'#120f17'` | Base color of the squares. Set it to your page background, the gaps show the page through. |
| `accent-color`      | `string`                             | `'#ff4fb8'` | Color of the first light that drifts across the squares.                                   |
| `secondary-color`   | `string`                             | `'#3b6bff'` | Color of the second light.                                                                 |
| `tile-size`         | `number`                             | `1`         | Size of the squares.                                                                       |
| `gap`               | `number`                             | `0.12`      | Width of the gaps between the squares.                                                     |
| `roundness`         | `number`                             | `0.25`      | Corner radius, from sharp squares at 0 to circles at 1.                                    |
| `softness`          | `number`                             | `0.5`       | How softly the edges of each square round off into the gaps.                               |
| `bulge`             | `number`                             | `0.3`       | How much each square domes up like a cushion. 0 keeps the tops flat.                       |
| `rotation`          | `number`                             | `35`        | Rotation of the grid, in degrees.                                                          |
| `gloss`             | `number`                             | `0.6`       | From soft satin at 0 to glossy at 1, with tighter highlights along the edges.              |
| `waves`             | `number`                             | `1`         | Height of the slow swells. 0 lays the surface flat.                                        |
| `wave-scale`        | `number`                             | `1`         | Size of the swells. Higher makes them broader.                                             |
| `speed`             | `number`                             | `0.6`       | Speed of the swells and the drifting lights.                                               |
| `shape`             | `'square' \| 'round'`                | `'square'`  | Shape of the ripples that travel across the surface.                                       |
| `pulse`             | `number`                             | `1`         | Height of the ripples. 0 turns them off.                                                   |
| `pulse-speed`       | `number`                             | `0.45`      | How fast the ripples travel.                                                               |
| `pulse-spacing`     | `number`                             | `1`         | Time between ripples.                                                                      |
| `pulse-width`       | `number`                             | `1`         | Width of each ripple.                                                                      |
| `pulse-origin`      | `'center' \| 'random'`               | `'center'`  | Start every ripple from the center, or from random spots on the surface.                   |
| `lighting`          | `'split' \| 'backlit' \| 'overhead'` | `'split'`   | Placement of the two lights: from either side, low behind the surface, or from above.      |
| `brightness`        | `number`                             | `1`         | Overall brightness.                                                                        |
| `tilt`              | `number`                             | `0.7`       | View angle, from straight down at 0 to low across the surface at 1.                        |
| `zoom`              | `number`                             | `1`         | Zoom. Higher brings the squares closer.                                                    |
| `depth`             | `number`                             | `10`        | How far the surface reaches before it fades into the page.                                 |
| `grain`             | `number`                             | `0.12`      | Strength of the film grain.                                                                |
| `fade`              | `number`                             | `0`         | Fades the edges into the page, from 0 to 1.                                                |
| `opacity`           | `number`                             | `1`         | Opacity of the whole effect.                                                               |
| `intro`             | `boolean`                            | `true`      | Switches the squares on from the center outward when the effect first appears.             |
| `mouse-interaction` | `boolean`                            | `true`      | Lets the cursor shape the surface and the view follow it slightly.                         |
| `hover-effect`      | `'press' \| 'lift' \| 'none'`        | `'press'`   | Whether the cursor presses the surface down or lifts it up.                                |
| `mouse-strength`    | `number`                             | `1`         | Depth of the cursor press or lift.                                                         |
| `mouse-radius`      | `number`                             | `0.35`      | Size of the area the cursor shapes.                                                        |
| `pulse-on-click`    | `boolean`                            | `true`      | Sends a ripple out from wherever you click.                                                |
| `detail`            | `'low' \| 'medium' \| 'high'`        | `'medium'`  | Smoothness of the surface. Lower it for weaker devices.                                    |
| `light-mode`        | `boolean`                            | `false`     | Draws pale squares with soft tints for light backgrounds.                                  |
| `paused`            | `boolean`                            | `false`     | Freezes the animation.                                                                     |
| `dpr`               | `number`                             | `auto`      | Maximum device pixel ratio, capped at 2.                                                   |
| `class`             | `string`                             | `''`        | Extra class names for the container.                                                       |

## Accessibility

AcidSquares is decorative. It draws to a `<canvas>` marked `aria-hidden`, so screen readers skip it. Clicks on links, buttons, inputs and other controls placed over it never start a ripple. With `prefers-reduced-motion: reduce`, the swells, ripples, intro and cursor effects stop and a still frame is drawn. The render loop pauses when the effect is offscreen or the tab is hidden.

## Credits

- Ported from [React Bits](https://reactbits.dev/backgrounds/acid-squares) by David Haz.
