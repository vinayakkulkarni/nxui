---
title: Prism
description: Rotating prism of glowing spectral light with configurable shape, colors and motion.
---

A raymarched prism of glowing spectral light drawn in one raw WebGL2 pass, with no extra dependencies. It fades in on mount and spins in place, tumbles in 3D, or holds still. Move the cursor over it and the prism tilts toward you.

::demo-prism
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/prism.json"
```

## Usage

```vue
<script setup lang="ts">
  import Prism from '~/components/ui/prism/Prism.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-black">
    <Prism
      animation-type="rotate"
      :time-scale="0.5"
      :height="3.5"
      :base-width="5.5"
      :scale="3.6"
      :glow="1"
      :hover-strength="2"
      :inertia="0.05"
    />
  </div>
</template>
```

The canvas is transparent. Pass `light-mode` on a white page to draw the light as colored ink instead of additive glow.

## Props

| Prop              | Type                                                          | Default          | Description                                                                                     |
| ----------------- | ------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `animation-type`  | `'rotate' \| '3drotate' \| 'rotate3d' \| 'hover' \| 'static'` | `'rotate'`       | Rotate spins in place, 3D rotate tumbles, hover turns only toward the cursor, static holds.     |
| `time-scale`      | `number`                                                      | `0.5`            | Speed of the rotation. 0 holds it still.                                                        |
| `colors`          | `string[]`                                                    | `[]`             | Custom colors cycled through the color bands, up to 8. Leave empty for the original spectrum.   |
| `glow`            | `number`                                                      | `1`              | Brightness of the light.                                                                        |
| `scale`           | `number`                                                      | `3.6`            | Size of the prism on screen. Larger values zoom in.                                             |
| `height`          | `number`                                                      | `3.5`            | Height of the prism from its base to its tip.                                                   |
| `base-width`      | `number`                                                      | `5.5`            | Width of the prism at its base.                                                                 |
| `hue-shift`       | `number`                                                      | `0`              | Rotates every color around the color wheel, in degrees.                                         |
| `color-frequency` | `number`                                                      | `1`              | How quickly the colors change through the light. Higher values show more bands.                 |
| `saturation`      | `number`                                                      | `1.5`            | Color intensity, from 0 (grayscale) to 2.                                                       |
| `noise`           | `number`                                                      | `0`              | Film grain over the light, from 0 to 1.                                                         |
| `offset`          | `{ x?: number; y?: number }`                                  | `{ x: 0, y: 0 }` | Moves the prism by a number of pixels, x to the right and y down.                               |
| `interactive`     | `boolean`                                                     | `true`           | Tilts the prism toward the cursor in every animation mode.                                      |
| `hover-strength`  | `number`                                                      | `2`              | How far the prism turns toward the cursor.                                                      |
| `inertia`         | `number`                                                      | `0.05`           | How quickly the prism follows the cursor, from 0.01 (slow and smooth) to 1 (instant).           |
| `intro`           | `boolean`                                                     | `true`           | Fades the light in on mount.                                                                    |
| `resolution`      | `number`                                                      | `0.5`            | Fraction of the screen resolution rendered, 0.25 to 1. The glow is soft, so 0.5 looks the same. |
| `light-mode`      | `boolean`                                                     | `false`          | Draws the light as colored ink for light backgrounds.                                           |
| `dpr`             | `number`                                                      | auto             | Maximum device pixel ratio, capped at 2.                                                        |
| `class`           | `string`                                                      | `''`             | Extra classes for the container.                                                                |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the prism renders a still frame: no intro, no rotation and no cursor tilt.
- Pointer tracking is passive and never blocks scrolling or clicks on content above the prism.
- Rendering stops when the prism is offscreen, the tab is hidden, or nothing is moving.

- Ported from [React Bits](https://reactbits.dev/backgrounds/prism) by David Haz.
