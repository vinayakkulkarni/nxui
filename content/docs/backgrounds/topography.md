---
title: Topography
description: A 3D landscape drawn in glowing contour lines that rises under the cursor, with light pulses on click.
---

A flat contour map rises into a 3D landscape of glowing lines while the camera glides over it, drawn with raw WebGL2 and a soft bloom. Move the cursor to lift the land under it (or trace and light its contour) and lean the camera toward it, and click to send a pulse of light rolling across the terrain or to raise a new peak. No extra dependencies.

::demo-topography
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/topography.json"
```

## Usage

```vue
<script setup lang="ts">
  import Topography from '~/components/ui/topography/Topography.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Topography
      color="#4f7cff"
      :line-count="22"
      :line-width="1.2"
      :elevation="1"
      :tilt="32"
      :speed="0.25"
      :glow="0.6"
      hover-effect="lift"
      click-effect="pulse"
    />
  </div>
</template>
```

Set `:tilt="90"` with `markers="plus"` for a top-down survey map, or `click-effect="peak"` to raise mountains where you click. On light pages pass `light-mode`: the lines draw as crisp ink instead of glowing light.

## Props

| Prop                | Type                                           | Default     | Description                                                                                                 |
| ------------------- | ---------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `color`             | `string`                                       | `'#4f7cff'` | Color of the contour lines. The brightest lines glow toward white.                                          |
| `line-count`        | `number`                                       | `22`        | How many contour lines stack up the tallest mountain.                                                       |
| `line-width`        | `number`                                       | `1.2`       | Width of the lines in px. Nearer lines draw a little thicker.                                               |
| `major-lines`       | `boolean`                                      | `true`      | Draws every fifth line bolder and brighter, like the index lines on a map.                                  |
| `elevation`         | `number`                                       | `1`         | How tall the mountains rise. 0 lays the map flat.                                                           |
| `foreground`        | `number`                                       | `0.2`       | How much height the land keeps as it reaches the camera. Low values settle it flat so the view stays clear. |
| `scale`             | `number`                                       | `1`         | Size of the landforms. Larger values give broader mountains.                                                |
| `detail`            | `number`                                       | `0.35`      | Fine wobble in the lines and small rings on the plains, from 0 to 1.                                        |
| `tilt`              | `number`                                       | `32`        | Camera angle in degrees, from a low view across the land to 90 for straight down.                           |
| `speed`             | `number`                                       | `0.25`      | How fast the camera glides over the land.                                                                   |
| `direction`         | `'forward' \| 'backward' \| 'left' \| 'right'` | `'forward'` | Which way the camera travels.                                                                               |
| `morph`             | `number`                                       | `0.2`       | How quickly the landforms reshape over time. 0 keeps the terrain still.                                     |
| `glow`              | `number`                                       | `0.6`       | Soft bloom around the lit lines.                                                                            |
| `depth-of-field`    | `number`                                       | `0.4`       | Softens lines away from the focus point, which follows the cursor.                                          |
| `fog`               | `number`                                       | `0.35`      | How quickly the land fades into the distance. 1 leaves only the foreground.                                 |
| `brightness`        | `number`                                       | `1`         | Overall brightness of the lines.                                                                            |
| `opacity`           | `number`                                       | `1`         | Overall opacity of the effect.                                                                              |
| `mouse-interaction` | `boolean`                                      | `true`      | Lets the cursor light and shape the terrain, and tilts the camera toward it.                                |
| `hover-effect`      | `'lift' \| 'trace' \| 'light'`                 | `'lift'`    | Lift raises the land under the cursor, trace lights the contour at its height, light only lights it.        |
| `mouse-radius`      | `number`                                       | `1`         | Size of the area the cursor affects.                                                                        |
| `mouse-strength`    | `number`                                       | `0.6`       | How high the land lifts and how brightly it lights.                                                         |
| `trail`             | `number`                                       | `0.3`       | How long the lifted land takes to settle back, from 0 to 1.                                                 |
| `parallax`          | `number`                                       | `0.5`       | How far the camera leans toward the cursor, from 0 to 1.                                                    |
| `click-effect`      | `'pulse' \| 'peak' \| 'none'`                  | `'pulse'`   | Pulse sends a ring of light rolling out over the land, peak raises a new mountain.                          |
| `markers`           | `'none' \| 'plus' \| 'dots'`                   | `'none'`    | Survey markers on a grid across the land. A few blink, and the ones near the cursor get a target frame.     |
| `glitch`            | `number`                                       | `0`         | How often brief data glitches slice through the lines, from 0 to 1.                                         |
| `intro`             | `boolean`                                      | `true`      | The map fades in flat and rises into mountains on mount.                                                    |
| `light-mode`        | `boolean`                                      | `false`     | Draws the lines as crisp ink for light backgrounds instead of glowing light.                                |
| `dpr`               | `number`                                       | auto        | Maximum device pixel ratio, capped at 2.                                                                    |
| `class`             | `string`                                       | `''`        | Extra classes for the container. Inline `style` falls through to the container.                             |

## Accessibility

- The canvas is decorative and carries `aria-hidden="true"`. Put real content above it.
- Pointer events are read from the window, so the effect never blocks clicks on content layered over it.
- With `prefers-reduced-motion: reduce` the camera stops gliding, the terrain stops morphing, the intro and glitches are skipped and the camera no longer leans toward the cursor. Hover lighting and click pulses still respond.
- The render loop sleeps when the effect is idle, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/topography) by David Haz.
