---
title: Dither Veil
description: A 1-bit dithered photo the cursor burns through to full colour, knitting back cell by cell.
---

A dithered image the cursor burns through to full colour. Move the pointer over the photo and a full-colour window follows it, knitting back into dither cell by cell as it passes. Click to send a ring of colour rippling out across the image.

::demo-dither-veil
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dither-veil.json"
```

## Usage

```vue
<script setup lang="ts">
  import DitherVeil from '~/components/ui/dither-veil/DitherVeil.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <DitherVeil
      pattern="floyd"
      :pixel-size="2"
      :levels="2"
      ink-color="#120f17"
      paper-color="#f4f1ea"
      :contrast="1.15"
      :reveal-radius="200"
    />
  </div>
</template>
```

## Props

| Prop            | Type                                                     | Default                             | Description                                                                                                                                             |
| --------------- | -------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`           | `string`                                                 | `'https://images.unsplash.com/...'` | Image to veil. Must be served with CORS headers.                                                                                                        |
| `fit`           | `'contain' \| 'cover'`                                   | `'contain'`                         | Show the whole image on the ink, or crop it to fill the container.                                                                                      |
| `pattern`       | `'bayer' \| 'noise' \| 'atkinson' \| 'floyd' \| 'lines'` | `'floyd'`                           | How the image is broken into dots: an ordered Bayer grid, blue noise stipple, Atkinson or Floyd-Steinberg error diffusion, or diagonal engraving lines. |
| `palette`       | `'duotone' \| 'rgb'`                                     | `'duotone'`                         | Duotone maps brightness between the ink and paper colours. RGB dithers each channel for a retro colour look.                                            |
| `pixel-size`    | `number`                                                 | `2`                                 | Size of each dither cell, in px.                                                                                                                        |
| `levels`        | `number`                                                 | `2`                                 | Tones per channel. 2 is pure 1-bit, higher values add in-between shades.                                                                                |
| `ink-color`     | `string`                                                 | `'#120f17'`                         | Colour of the darkest tone.                                                                                                                             |
| `paper-color`   | `string`                                                 | `'#f4f1ea'`                         | Colour of the lightest tone.                                                                                                                            |
| `contrast`      | `number`                                                 | `1.15`                              | Tonal contrast applied before dithering.                                                                                                                |
| `brightness`    | `number`                                                 | `0`                                 | Shifts the image lighter or darker before dithering.                                                                                                    |
| `reveal-radius` | `number`                                                 | `200`                               | Radius of the full-colour window around the cursor, in px.                                                                                              |
| `softness`      | `number`                                                 | `0.6`                               | How much of the reveal edge dissolves through the dither. 0 is a hard cut.                                                                              |
| `linger`        | `number`                                                 | `1`                                 | Seconds the revealed trail takes to knit back into dither. 0 turns the trail off.                                                                       |
| `rim-color`     | `string`                                                 | `'#a78bfa'`                         | Colour of the cells along the dissolving edge.                                                                                                          |
| `rim`           | `number`                                                 | `0`                                 | Thickness of the coloured rim on the dissolving edge. 0 hides it.                                                                                       |
| `reverse`       | `boolean`                                                | `false`                             | Start in full colour and dither wherever the cursor goes.                                                                                               |
| `wander`        | `boolean`                                                | `false`                             | Let the reveal drift around on its own while the pointer is away.                                                                                       |
| `click-burst`   | `boolean`                                                | `true`                              | Clicking sends a ring of colour rippling out across the image.                                                                                          |
| `class`         | `string`                                                 | `''`                                | Extra classes for the root element.                                                                                                                     |

## Accessibility

- The canvas is decorative. Add a visible caption or an `aria-label` on a parent if the image carries meaning.
- With `prefers-reduced-motion: reduce` the reveal still follows the cursor, but `wander` is ignored so nothing moves on its own.
- The render loop stops while the component is offscreen or idle, and the WebGL context is released on unmount.
- Needs WebGL 2. Without it the component renders an empty container.

- Ported from [React Bits](https://reactbits.dev/animations/dither-veil) by David Haz.
