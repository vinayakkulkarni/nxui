---
title: Pixel Trail
description: Glossy pixels melt into a fluid goo trail behind the cursor, with color shifts, drips, sparkle, click bursts, dither and image reveals.
---

A WebGL2 trail of crisp, glossy pixels follows the cursor. With the gooey filter on, neighbouring pixels melt into one liquid blob with bevels, highlights and a soft glow; with it off you get separate squares, dots or diamonds that fade, shrink or dither away. Move around the demo, and click when a preset has click bursts on.

::demo-pixel-trail
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-trail.json"
```

## Usage

The trail fills its parent and ignores pointer events, so content under it stays clickable.

```vue
<script setup lang="ts">
  import PixelTrail from '~/components/ui/pixel-trail/PixelTrail.vue';
</script>

<template>
  <div class="relative h-100 w-full overflow-hidden">
    <PixelTrail
      :grid-size="50"
      :max-age="500"
      color="#A855F7"
      trail-color="#22D3EE"
      :gooey-filter="{ strength: 3 }"
      :gravity="0.6"
      click-burst
    />
  </div>
</template>
```

The cursor paints soft brush strokes into an offscreen 512×512 canvas. A single fragment shader samples it on a `grid-size` grid and, when goo is on, blurs the cells with an analytic Gaussian so they merge into one shaded surface. Pass `image-src` to make each pixel take the color of the image beneath it (the image must allow CORS).

## Props

| Prop              | Type                                | Default           | Description                                                           |
| ----------------- | ----------------------------------- | ----------------- | --------------------------------------------------------------------- |
| `grid-size`       | `number`                            | `40`              | Number of pixels across the longer side                               |
| `trail-size`      | `number`                            | `0.1`             | Brush radius, as a fraction of the longer side                        |
| `max-age`         | `number`                            | `250`             | How long each part of the trail lasts, in ms                          |
| `interpolate`     | `number`                            | `5`               | In-between points on fast moves; higher is smoother                   |
| `easing-function` | `(x: number) => number`             | `x => x`          | Curve for how the trail swells in and fades out                       |
| `color`           | `string`                            | `'#ffffff'`       | Pixel color                                                           |
| `trail-color`     | `string`                            | `undefined`       | Second color the trail shifts to as it ages                           |
| `gooey-filter`    | `{ strength?: number } \| false`    | `{ strength: 2 }` | Melts pixels into liquid blobs; higher is rounder. `false` for no goo |
| `shape`           | `'square' \| 'circle' \| 'diamond'` | `'square'`        | Pixel shape when goo is off                                           |
| `gap`             | `number`                            | `0.08`            | Space between pixels (0–0.9); draws fine seams when goo is on         |
| `decay`           | `'fade' \| 'shrink' \| 'dither'`    | `'fade'`          | How pixels disappear                                                  |
| `flow`            | `number`                            | `0`               | How much the trail keeps drifting in the cursor's direction (0–1)     |
| `gravity`         | `number`                            | `0`               | Trail sags down as it fades; negative values rise (-1–1)              |
| `sparkle`         | `number`                            | `0`               | Makes fading pixels flicker (0–1)                                     |
| `click-burst`     | `boolean`                           | `false`           | Clicking splashes a ring of trail out from the cursor                 |
| `shine`           | `number`                            | `0.6`             | Bevels, brighter core and highlights (0–1)                            |
| `glow`            | `number`                            | `0.4`             | Soft glow around the trail (0–1)                                      |
| `image-src`       | `string`                            | `undefined`       | Image the trail reveals                                               |
| `dpr`             | `number`                            | auto (max 2)      | Device pixel ratio for the canvas                                     |
| `class`           | `string`                            | `''`              | Extra classes for the container                                       |

## Accessibility

- The canvas is `aria-hidden` and the layer has `pointer-events: none`.
- With `prefers-reduced-motion: reduce`, `flow`, `gravity` and `sparkle` are turned off, so the trail only follows the pointer.
- Rendering stops when the trail has faded or the container is off screen.

- Ported from [React Bits](https://reactbits.dev/animations/pixel-trail) by David Haz.
