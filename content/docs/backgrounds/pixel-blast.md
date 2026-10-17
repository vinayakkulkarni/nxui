---
title: Pixel Blast
description: Dithered pixel clouds that drift, shimmer and light up under the cursor, with ripples, shapes and a perspective floor.
---

Dithered pixel clouds that drift and shimmer on raw WebGL2. The pixels blast out from the center on mount, the cursor lights up the pixels around it, and every click sends a ring of pixels across the area. Pick from six pixel shapes, or tilt the pattern back into a perspective floor.

::demo-pixel-blast
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-blast.json"
```

## Usage

```vue
<script setup lang="ts">
  import PixelBlast from '~/components/ui/pixel-blast/PixelBlast.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <PixelBlast
      variant="circle"
      color="#7DD3FC"
      accent-color="#E0F2FE"
      :pixel-size="7"
      :pixel-size-jitter="0.5"
      hover-effect="grow"
      :auto-ripple="2"
    />
  </div>
</template>
```

The component fills its parent. The pattern lives in a small grid of cells that is simulated once per frame and then dithered with an 8×8 Bayer matrix at full resolution. Rendering stops when the animation goes quiet, when the tab is hidden, and while the background is scrolled out of view.

## Props

| Prop                     | Type                                                                   | Default     | Description                                                                                 |
| ------------------------ | ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `color`                  | `string`                                                               | `'#B497CF'` | Color of the pixels.                                                                        |
| `accent-color`           | `string`                                                               | `color`     | Color the densest areas, ripples and the area under the cursor shift toward.                |
| `variant`                | `'square' \| 'circle' \| 'triangle' \| 'diamond' \| 'cross' \| 'ring'` | `'square'`  | Shape of each pixel.                                                                        |
| `pixel-size`             | `number`                                                               | `3`         | Size of each pixel, in px.                                                                  |
| `pattern-scale`          | `number`                                                               | `2`         | Zoom of the cloud pattern. Higher values make smaller, busier clouds.                       |
| `pattern-density`        | `number`                                                               | `1`         | How many pixels light up. Higher values fill more of the area.                              |
| `pixel-size-jitter`      | `number`                                                               | `0`         | Random size variation between pixels, from 0 to 1.                                          |
| `softness`               | `number`                                                               | `0.6`       | Lets pixels grow and shrink smoothly as the pattern moves, instead of popping on and off.   |
| `smoothing`              | `number`                                                               | `1`         | Smooths the edges of the clouds. 0 keeps the original blocky steps.                         |
| `glow`                   | `number`                                                               | `0.4`       | Soft light behind the densest areas, and a hot core in ripples.                             |
| `twinkle`                | `number`                                                               | `0.25`      | Lets pixels shimmer at their own pace, from 0 to 1.                                         |
| `speed`                  | `number`                                                               | `0.5`       | How fast the clouds change shape.                                                           |
| `drift`                  | `number`                                                               | `0.2`       | How fast the clouds slide across the area. 0 keeps them in place.                           |
| `drift-angle`            | `number`                                                               | `30`        | Direction of the drift, in degrees.                                                         |
| `hover-effect`           | `'reveal' \| 'grow' \| 'none'`                                         | `'reveal'`  | What the cursor does: light up more pixels around it, or make nearby pixels swell and glow. |
| `hover-radius`           | `number`                                                               | `140`       | Size of the area the cursor affects, in px.                                                 |
| `enable-ripples`         | `boolean`                                                              | `true`      | Clicking sends a ring of pixels out from the click.                                         |
| `ripple-speed`           | `number`                                                               | `0.3`       | How fast ripples spread.                                                                    |
| `ripple-thickness`       | `number`                                                               | `0.1`       | Width of the ripple ring.                                                                   |
| `ripple-intensity-scale` | `number`                                                               | `1`         | Brightness of ripples.                                                                      |
| `auto-ripple`            | `number`                                                               | `0`         | Sends a ripple from a random spot about this many seconds apart. 0 turns it off.            |
| `tilt-x`                 | `number`                                                               | `0`         | Tilts the pixels back into a floor that fades toward the horizon, in degrees.               |
| `tilt-y`                 | `number`                                                               | `0`         | Turns the pixels sideways in perspective, in degrees.                                       |
| `edge-fade`              | `number`                                                               | `0.5`       | Fades the pixels out toward the edges, from 0 to 1.                                         |
| `intro`                  | `boolean`                                                              | `true`      | Blasts the pixels out from the center in a ring on mount.                                   |
| `noise-amount`           | `number`                                                               | `0`         | Film grain on the pixels.                                                                   |
| `transparent`            | `boolean`                                                              | `true`      | Shows the page behind the pixels. Off draws a solid black (white in light mode) backdrop.   |
| `light-mode`             | `boolean`                                                              | `false`     | Darkens hot pixels instead of brightening them, for light pages.                            |
| `variation`              | `number`                                                               | random      | Picks a fixed pattern. Leave it out for a different one on every mount.                     |
| `auto-pause-offscreen`   | `boolean`                                                              | `true`      | Stops rendering while the background is scrolled out of view.                               |
| `dpr`                    | `number`                                                               | auto        | Maximum device pixel ratio, capped at 2.                                                    |
| `class`                  | `string`                                                               | `''`        | Extra classes for the container.                                                            |

## Accessibility

- The canvas is `aria-hidden`; the container carries an `aria-label`. Put real content on top of it in your own markup.
- Pointer input is read from `window`, so content layered on top stays fully interactive while the cursor still lights up the pixels.
- With `prefers-reduced-motion: reduce` the pattern holds still: no intro, drift, twinkle or ripples. The cursor highlight still follows the pointer.

- Ported from [React Bits](https://reactbits.dev/backgrounds/pixel-blast) by David Haz.
