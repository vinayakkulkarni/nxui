---
title: Lens Distortion
description: An image filter that splits an image into shifting color layers, like the chromatic aberration of a lens, and warps its geometry outward or inward like barrel and pincushion distortion. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-lens-distortion
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-lens-distortion.json"
```

## Usage

```vue
<script setup lang="ts">
  import PaperLensDistortion from '~/components/ui/paper-lens-distortion/PaperLensDistortion.vue';
  import { getPaperLensDistortionPreset } from '~/components/ui/paper-lens-distortion/paper-lens-distortion-presets';
</script>

<template>
  <div class="relative h-100 w-full overflow-hidden rounded-lg">
    <PaperLensDistortion
      image="/flowers.webp"
      v-bind="getPaperLensDistortionPreset('Fisheye').params"
    />
  </div>
</template>
```

## Presets

The four upstream presets ship in `paper-lens-distortion-presets.ts`. Each one sets every prop below except `image` and `class`.

| Preset    | Look                                              |
| --------- | ------------------------------------------------- |
| `Default` | Swirled spectral split, clear center              |
| `Fisheye` | Circular fisheye bulge with a radial color burst  |
| `Duotone` | Two offset color layers with film grain           |
| `Smoke`   | Noise-scattered smear that keeps the image colors |

`paperLensDistortionPresets` holds all four in upstream order. `getPaperLensDistortionPreset(name)` returns one by name.

## Props

| Prop | Type | Default | Description |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------- |
| `image` | `string` | `''` | Source image URL — required, the lens filter is applied to this image |
| `spread` | `number` | `0.6` | Strength of the color split; how far the color layers are pushed apart, 0 is off (0 to 1) |
| `bias` | `number` | `1` | Shifts the colors toward one end of the spread; 0 spaces them evenly (-1 to 1) |
| `angle` | `number` | `0` | Direction of the spread in degrees, needs perspective < 1 (0 to 360) |
| `perspective` | `number` | `0.1` | Spread direction from a straight line (0) to a radial burst out from the center (1) |
| `count` | `number` | `35` | Number of sampled color layers along the spread; higher is smoother and costlier (2 to 50) |
| `dispersion` | `number` | `1` | Color dispersion: 1 gives each layer its own spectrum color, 0 keeps the image color |
| `dispersion-shift` | `number` | `0` | Dispersion balance: -1 keeps it in the center only, 1 at the edges only, 0 evenly (-1 to 1) |
| `dispersion-color` | `number` | `0.6` | Rotates the colors around the hue wheel, 0 to 1 for a full turn |
| `focus-center` | `number` | `0.8` | Reduces the spread in a circular zone at the center (0 to 1) |
| `focus-edges` | `number` | `1` | Reduces the spread toward the edges; 1 restores the original image there (0 to 1) |
| `swirl` | `number` | `0.35` | Rotates the color layers around the center by an angle growing along the spread (-1 to 1) |
| `noise` | `number` | `0` | Scatters the spread direction with noise, 0 is off (0 to 1) |
| `noise-frequency` | `number` | `0.25` | Frequency of the noise; higher is finer (0 to 1) |
| `noise-offset` | `number` | `0` | Offsets the noise pattern for a different seed (0 to 1) |
| `lens-bulge` | `number` | `0` | Radial lens warp: positive bulges out like a fisheye, negative pinches in (-1 to 1) |
| `lens-circle` | `number` | `0` | Squeezes pixels outside the inscribed circle so the outline becomes a circle (0 to 1) |
| `grain-mixer` | `number` | `0` | Scatters the spread with grain noise, breaking up the layer edges (0 to 1) |
| `grain-overlay` | `number` | `0` | Post-processing black/white grain overlay (0 to 1) |
| `image-x` | `number` | `0` | Pans the image horizontally behind the effect, 0 is centered (-1 to 1) |
| `image-y` | `number` | `0` | Pans the image vertically behind the effect, 0 is centered (-1 to 1) |
| `speed` | `number` | `0` | Animation speed multiplier (0 freezes) |
| `frame` | `number` | `0` | Initial/seek frame for deterministic rendering |
| `fit` | `'none' \| 'contain' \| 'cover'` | `'contain'` | How the graphic fits the canvas |
| `scale` | `number` | `1` | Overall zoom level (0.1 to 4) |
| `rotation` | `number` | `0` | Overall rotation in degrees (0 to 360) |
| `origin-x` | `number` | `0.5` | Horizontal origin for world positioning (0 to 1) |
| `origin-y` | `number` | `0.5` | Vertical origin for world positioning (0 to 1) |
| `offset-x` | `number` | `0` | Horizontal offset of the graphics center (-1 to 1) |
| `offset-y` | `number` | `0` | Vertical offset of the graphics center (-1 to 1) |
| `world-width` | `number` | `0` | Virtual world width before canvas fitting |
| `world-height` | `number` | `0` | Virtual world height before canvas fitting |
| `class` | `string` | — | Additional CSS classes |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount. This is an
unofficial community port; it is not maintained by Paper.
