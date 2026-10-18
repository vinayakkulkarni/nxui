---
title: ASCII Effect
description: Responsive image-to-ASCII renderer on a 2D canvas with three variants — a static image, a flowing wave field with a pointer ripple, and a signal glitch with a radial reveal.
---

ASCII Effect samples an image into a grid of characters, dithers the luminance, and draws it on a canvas that resizes with its container. The `flow` variant drifts the characters in a wave and ripples them around the pointer; the `glitch` variant reveals the image from the center and tears random rows sideways.

::demo-ascii-effect
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ascii-effect.json"
```

## Usage

```vue
<script setup lang="ts">
  import AsciiEffect from '~/components/ui/ascii-effect/AsciiEffect.vue';
</script>

<template>
  <div class="relative h-130 overflow-hidden rounded-2xl">
    <AsciiEffect
      variant="flow"
      image-src="/images/portrait.webp"
      :font-size="6"
      :scale="1"
      :flow-speed="0.22"
      :flow-strength="12"
      :mouse-radius="150"
      :mouse-strength="22"
    />
  </div>
</template>
```

The component fills its parent, so give the parent a height. The image is read with `getImageData`, so remote images must be served with CORS headers.

### Variant presets

`AsciiEffectImage`, `AsciiEffectFlow` and `AsciiEffectGlitch` take every prop except `variant` and default `colors` to a variant palette (grey, cyan–indigo, lime–cyan).

```vue
<script setup lang="ts">
  import AsciiEffectGlitch from '~/components/ui/ascii-effect/AsciiEffectGlitch.vue';
</script>

<template>
  <div class="relative h-130 overflow-hidden">
    <AsciiEffectGlitch
      image-src="/images/portrait.webp"
      :glitch-intensity="0.65"
      :glitch-frequency="1.4"
      :reveal-duration="1400"
    />
  </div>
</template>
```

## Props

| Prop                | Type                                     | Default                          | Description                                           |
| ------------------- | ---------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| `image-src`         | `string`                                 | required                         | Image URL rendered as ASCII characters                |
| `variant`           | `'image' \| 'flow' \| 'glitch'`          | `'image'`                        | Visual effect variation                               |
| `chars`             | `string`                                 | `' .:-=+*#%@'`                   | Characters ordered from darkest to brightest          |
| `font-size`         | `number`                                 | `9`                              | Character height in pixels                            |
| `font-family`       | `string`                                 | `'Arial, Helvetica, sans-serif'` | Font stack used to draw the characters                |
| `font-weight`       | `number \| string`                       | `400`                            | Canvas font weight                                    |
| `line-height`       | `number`                                 | `1`                              | Character row height multiplier                       |
| `character-spacing` | `number`                                 | `1`                              | Horizontal character-cell spacing multiplier          |
| `brightness-boost`  | `number`                                 | `2.2`                            | Multiplier applied to sampled image luminance         |
| `contrast`          | `number`                                 | `1.1`                            | Contrast applied before character selection           |
| `threshold`         | `number`                                 | `0.06`                           | Dark-pixel cutoff that keeps the background clean     |
| `posterize`         | `number`                                 | `32`                             | Number of luminance steps                             |
| `dither`            | `'none' \| 'floyd-steinberg' \| 'bayer'` | `'floyd-steinberg'`              | Dithering algorithm used to keep photographic detail  |
| `dither-strength`   | `number`                                 | `0.8`                            | Amount of error diffusion or ordered dithering        |
| `flow-speed`        | `number`                                 | `0.22`                           | Flow cycles per second (`flow` variant)               |
| `flow-direction`    | `number`                                 | `0`                              | Flow direction in degrees                             |
| `flow-strength`     | `number`                                 | `12`                             | Directional displacement in pixels                    |
| `flow-frequency`    | `number`                                 | `0.018`                          | Size of the flowing wave field                        |
| `mouse-radius`      | `number`                                 | `150`                            | Radius of the pointer ripple in pixels                |
| `mouse-strength`    | `number`                                 | `22`                             | Pointer ripple displacement in pixels                 |
| `mouse-wave-speed`  | `number`                                 | `1.2`                            | Speed of the pointer ripple                           |
| `scale`             | `number`                                 | `1.15`                           | Image zoom inside the ASCII field                     |
| `fit`               | `'cover' \| 'contain' \| 'stretch'`      | `'cover'`                        | How the source image fits the canvas                  |
| `colors`            | `string[]`                               | `['#f4f4f5', '#a1a1aa']`         | Hex colors used as a luminance gradient               |
| `color-mode`        | `'gradient' \| 'source'`                 | `'gradient'`                     | Use the gradient or colors sampled from the image     |
| `background-color`  | `string`                                 | `'#07090d'`                      | Canvas background color                               |
| `invert`            | `boolean`                                | `false`                          | Reverse the luminance-to-character mapping            |
| `glitch-intensity`  | `number`                                 | `0.65`                           | Strength and number of displaced row bands (`glitch`) |
| `glitch-frequency`  | `number`                                 | `1.4`                            | Approximate glitches per second                       |
| `reveal-duration`   | `number`                                 | `1400`                           | Radial reveal duration in milliseconds (`glitch`)     |
| `alt`               | `string`                                 | `'ASCII rendering'`              | Accessible label for the canvas                       |
| `class`             | `string`                                 | `''`                             | Additional classes for the container                  |

## Accessibility

- The canvas has `role="img"` and uses `alt` as its accessible name. Describe the image, not the effect.
- With `prefers-reduced-motion: reduce`, the flow and glitch variants render one static frame: no drift, no ripple, no glitch bands, no reveal.
- The animation loop pauses while the component is off screen.
- The pointer ripple is decoration only; nothing depends on it.

- Ported from [componentry.fun](https://componentry.dev/docs/components/ascii-effect) by Harsh Jadhav.
