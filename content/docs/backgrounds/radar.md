---
title: Radar
description: A radar scope whose sweep leaves a phosphor afterglow and picks up moving contacts. Switch to sonar pulses or tilt it back into a floor view.
---

# Radar

A detailed radar scope: range rings, bearing spokes, a tick bezel and a glowing beam that leaves a phosphor afterglow and lights up speckled clutter as it passes. Moving contacts ping when the sweep crosses them, then fade with a short trail of older echoes. Move the pointer over the scope and the grid warms up around it while the sweep picks your cursor up as a contact. `mode="pulse"` swaps the beam for sonar rings, `tilt` lays the scope back like a floor, and `light-mode` draws it as ink for pale pages. The rings draw in on mount. It renders on raw WebGL2 with a bloom pass and pauses when offscreen.

::demo-radar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/radar.json"
```

## Usage

```vue
<script setup lang="ts">
  import Radar from '~/components/ui/radar/Radar.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Radar
      color="#3ef09a"
      mode="sweep"
      :speed="1"
      :ring-count="6"
      :targets="6"
      :clutter="0.35"
    />
  </div>
</template>
```

## Props

| Prop                | Type                 | Default         | Description                                                                           |
| ------------------- | -------------------- | --------------- | ------------------------------------------------------------------------------------- |
| `color`             | `string`             | `'#3ef09a'`     | Color of the sweep and the contacts.                                                  |
| `background-color`  | `string`             | `'transparent'` | Fills the canvas behind the radar. Leave it transparent to let the page show through. |
| `mode`              | `'sweep' \| 'pulse'` | `'sweep'`       | A rotating beam, or sonar rings that expand from the center.                          |
| `speed`             | `number`             | `1`             | Speed of the sweep. Negative values sweep counterclockwise.                           |
| `trail`             | `number`             | `0.35`          | How long the afterglow lingers behind the sweep, from 0 to 1.                         |
| `scale`             | `number`             | `0.9`           | Size of the radar, relative to the shorter side of the view.                          |
| `ring-count`        | `number`             | `6`             | Number of range rings.                                                                |
| `spoke-count`       | `number`             | `12`            | Number of faint bearing lines. 0 hides them.                                          |
| `ticks`             | `boolean`            | `true`          | Shows the bearing scale around the edge.                                              |
| `targets`           | `number`             | `6`             | Number of moving contacts the sweep picks up, up to 16.                               |
| `clutter`           | `number`             | `0.35`          | Amount of speckled returns the sweep lights up, from 0 to 1.                          |
| `glow`              | `number`             | `1`             | Strength of the soft light around the beam and contacts.                              |
| `brightness`        | `number`             | `1`             | Overall brightness.                                                                   |
| `grid-opacity`      | `number`             | `1`             | Opacity of the rings, ticks and lines, from 0 to 2.                                   |
| `line-width`        | `number`             | `1`             | Width of the grid lines in px.                                                        |
| `tilt`              | `number`             | `0`             | Tilts the radar back in perspective like a floor, in degrees.                         |
| `center-x`          | `number`             | `0.5`           | Horizontal position of the radar center, from 0 to 1.                                 |
| `center-y`          | `number`             | `0.5`           | Vertical position of the radar center, from 0 at the top to 1 at the bottom.          |
| `mouse-interaction` | `boolean`            | `true`          | Lights up the grid near the cursor, and the sweep picks the cursor up as a contact.   |
| `intro`             | `boolean`            | `true`          | Draws the rings in and starts the sweep on mount.                                     |
| `grain`             | `number`             | `0.03`          | Strength of the film grain.                                                           |
| `fade`              | `number`             | `0`             | Fades the edges into the page, from 0 to 1.                                           |
| `opacity`           | `number`             | `1`             | Opacity of the whole effect.                                                          |
| `light-mode`        | `boolean`            | `false`         | Draws the radar as ink for light backgrounds.                                         |
| `paused`            | `boolean`            | `false`         | Freezes the animation.                                                                |
| `dpr`               | `number`             | auto            | Maximum device pixel ratio, capped at 2.                                              |
| `class`             | `string`             | `''`            | Extra classes for the container.                                                      |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the sweep, intro and cursor effects stop and a single still frame is drawn.
- The render loop pauses when the radar scrolls offscreen or the tab is hidden, and sleeps when `paused` is set and nothing is settling.

- Ported from [React Bits](https://reactbits.dev/backgrounds/radar) by David Haz.
