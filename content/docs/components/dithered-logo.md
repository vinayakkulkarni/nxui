---
title: Dithered Logo
description: Renders any logo as a Floyd-Steinberg dithered particle field with cursor repulsion and click ripples.
---

::demo-dithered-logo
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dithered-logo.json"
```

## Usage

```vue
<script setup lang="ts">
  import DitheredLogo from '~/components/ui/dithered-logo/DitheredLogo.vue';
</script>

<template>
  <DitheredLogo image-src="/images/logo.svg" class="size-72" />
</template>
```

The source image is downsampled to a grid, blurred, gamma/contrast
adjusted, then run through serpentine Floyd–Steinberg error-diffusion
dithering. Every resulting dot becomes a physics particle: the cursor
repels nearby particles with a cubic falloff, and every click launches an
expanding ripple band that shoves particles outward before they spring
back. With `invert` (default) the mask is flipped so the logo appears as
negative space inside a rounded plate of particles. `particleColor`
defaults to `currentColor`, so the field follows your text color in light
and dark mode.

## Props

| Prop                 | Type      | Default          | Description                                        |
| -------------------- | --------- | ---------------- | -------------------------------------------------- |
| `image-src`          | `string`  | —                | Image/SVG source for the dithered particle field   |
| `grid-size`          | `number`  | `200`            | Maximum sampled image dimension before dithering   |
| `scale`              | `number`  | `0.5`            | Relative scale of the logo inside the canvas       |
| `dot-scale`          | `number`  | `1`              | Multiplier for each rendered particle size         |
| `invert`             | `boolean` | `true`           | Invert the generated dithered mask                 |
| `corner-radius`      | `number`  | `0.2`            | Rounded mask radius used when invert mode is on    |
| `threshold`          | `number`  | `180`            | Brightness threshold for error-diffusion dithering |
| `contrast`           | `number`  | `0`              | Contrast adjustment applied before dithering       |
| `gamma`              | `number`  | `1`              | Gamma correction applied before dithering          |
| `blur`               | `number`  | `3.75`           | Blur applied before sampling the grayscale grid    |
| `diffusion-strength` | `number`  | `1`              | Strength of the Floyd–Steinberg error diffusion    |
| `serpentine`         | `boolean` | `true`           | Alternate dither scan direction on every row       |
| `particle-color`     | `string`  | `'currentColor'` | Particle color                                     |

## Credits

Ported from [componentry.fun](https://componentry.dev/docs/components/dithered-logo)
by [@harshjdhv](https://x.com/harshjdhv).
