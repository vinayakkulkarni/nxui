---
title: Dither
description: Retro dithered waves with Bayer, halftone, line and noise patterns, palettes, cursor trails and click ripples.
---

# Dither

Slow fractal waves drawn in crisp retro pixels. Pick a dither pattern (Bayer 8×8, 4×4, 2×2, halftone, lines, crosshatch or noise), a number of shades, or swap the colors for an indexed palette like Game Boy or Blueprint. Move the pointer and it erases, reveals or ripples the waves, leaving a fading trail; click to send a ring through the field. On mount the waves bloom out from the center. It renders on raw WebGL2 in two passes, so the pixels stay sharp at any size.

::demo-dither
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dither.json"
```

## Usage

```vue
<script setup lang="ts">
  import Dither from '~/components/ui/dither/Dither.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Dither
      wave-color="#bcbcbc"
      background-color="#120f17"
      dither-mode="bayer"
      :pixel-size="2"
      mouse-effect="erase"
      :mouse-radius="0.3"
    />
  </div>
</template>
```

## Props

| Prop                       | Type                                                                                            | Default           | Description                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `wave-color`               | `string \| [number, number, number]`                                                            | `[0.5, 0.5, 0.5]` | Color of the waves. Any CSS color, or a linear RGB array from 0 to 1.                     |
| `background-color`         | `string \| [number, number, number]`                                                            | `[0, 0, 0]`       | Color behind the waves. Use `'transparent'` to dither the waves over your own background. |
| `dither-mode`              | `'bayer' \| 'bayer4' \| 'bayer2' \| 'halftone' \| 'lines' \| 'crosshatch' \| 'noise' \| 'none'` | `'bayer'`         | Pattern used to dither the shades.                                                        |
| `palette`                  | `string[]`                                                                                      | —                 | Two to eight colors from dark to light. Replaces the wave and background colors.          |
| `color-num`                | `number`                                                                                        | `4`               | Number of shades per color channel.                                                       |
| `pixel-size`               | `number`                                                                                        | `2`               | Size of each dither pixel, in px.                                                         |
| `scale`                    | `number`                                                                                        | `1`               | Size of the wave pattern.                                                                 |
| `wave-speed`               | `number`                                                                                        | `0.05`            | Speed of the wave animation.                                                              |
| `wave-frequency`           | `number`                                                                                        | `3`               | How much finer each layer of detail gets.                                                 |
| `wave-amplitude`           | `number`                                                                                        | `0.3`             | How strongly the finer layers of detail show.                                             |
| `contrast`                 | `number`                                                                                        | `1`               | Contrast of the waves before dithering.                                                   |
| `brightness`               | `number`                                                                                        | `0`               | Brightens or darkens the waves.                                                           |
| `enable-mouse-interaction` | `boolean`                                                                                       | `true`            | Lets the cursor interact with the waves.                                                  |
| `mouse-effect`             | `'erase' \| 'reveal' \| 'ripple'`                                                               | `'erase'`         | Erase darkens the waves under the cursor, reveal lights them up and ripple bends them.    |
| `mouse-radius`             | `number`                                                                                        | `1`               | Radius of the cursor effect.                                                              |
| `mouse-strength`           | `number`                                                                                        | `1`               | Strength of the cursor effect.                                                            |
| `trail`                    | `number`                                                                                        | `0.5`             | How long the cursor leaves a fading trail, from 0 to 1.                                   |
| `click-ripple`             | `boolean`                                                                                       | `true`            | Clicking sends a ring through the waves.                                                  |
| `intro`                    | `boolean`                                                                                       | `true`            | Resolves from the center to full detail on mount.                                         |
| `disable-animation`        | `boolean`                                                                                       | `false`           | Freezes the wave animation.                                                               |
| `dpr`                      | `number`                                                                                        | auto              | Maximum device pixel ratio, capped at 2.                                                  |
| `class`                    | `string`                                                                                        | `''`              | Extra classes for the container.                                                          |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the waves, intro, trail and ripples stop and a single still frame is drawn.
- The render loop pauses when the canvas scrolls offscreen or the tab is hidden, and sleeps when the animation is disabled and nothing is settling.

- Ported from [React Bits](https://reactbits.dev/backgrounds/dither) by David Haz.
