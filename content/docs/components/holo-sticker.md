---
title: Holo Sticker
description: A die-cut holographic sticker rendered in WebGL — rainbow foil sweeps with your cursor.
---

# Holo Sticker

A realistic holographic sticker rendered in WebGL. Feed it any artwork with transparency and it becomes a die-cut sticker with a silver foil base, a rainbow diffraction film that sweeps as you move your cursor, and an embossed print relief that lifts the ink off the vinyl.

The peel slider curls a corner of the sticker up from the surface — the reflected spectrum shifts across the fold, exactly like turning a real sticker.

## Usage

```vue
<script setup lang="ts">
  import HoloSticker from '~/components/ui/holo-sticker/HoloSticker.vue';
</script>

<template>
  <HoloSticker src="/my-artwork.svg" class="h-120" />
</template>
```

The `src` prop accepts SVG, PNG, JPG or WebP (including data URLs). Alpha transparency defines the die-cut outline — anything transparent is cut away, leaving a foil border.

## Finishes

| Finish    | Description                                              |
| --------- | -------------------------------------------------------- |
| `holo`    | Classic rainbow foil — high metalness, medium roughness  |
| `chrome`  | Mirror chrome — near-zero roughness, full metalness      |
| `gloss`   | Clear-laminate gloss — subtle reflection, no diffraction |
| `matte`   | Soft-touch matte — low sheen, faint film                 |
| `glitter` | Sparkle foil — per-cell glitter twinkle over the film    |

## Props

| Prop          | Type                       | Default | Description                                    |
| ------------- | -------------------------- | ------- | ---------------------------------------------- |
| `src`         | `string`                   | `''`    | Artwork URL or data URL; alpha = die-cut shape |
| `settings`    | `Partial<StickerSettings>` | `{}`    | Overrides merged over the defaults             |
| `tilt-locked` | `boolean`                  | `false` | Disable cursor-following tilt                  |
| `class`       | `string`                   | `''`    | Additional classes                             |

## Sticker settings

| Setting          | Default                    | Description                                              |
| ---------------- | -------------------------- | -------------------------------------------------------- |
| `finish`         | `'holo'`                   | Surface finish preset (see above)                        |
| `size`           | `0.74`                     | Sticker scale within the canvas, 0.3–1                   |
| `border`         | `0.019`                    | Die-cut white/foil border width, 0–0.08                  |
| `cutTolerance`   | `0.03`                     | Interior gaps smaller than this stay foil, 0–0.12        |
| `holoIntensity`  | `0.6`                      | Rainbow intensity, 0–1                                   |
| `bands`          | `9`                        | Rainbow band frequency, 1–20                             |
| `hueShift`       | `0`                        | Extra hue rotation, 0–1                                  |
| `grain`          | `0`                        | Foil grain / glitter amount, 0–1                         |
| `pattern`        | `'linear'`                 | Rainbow pattern: `linear`, `radial`, `patches`           |
| `overlay`        | `'none'`                   | Facet overlay: `none`, `triangles`, `squares`, `stripes` |
| `ink`            | `1`                        | Ink density: 0 = foil only, 2 = densified                |
| `relief`         | `0.22`                     | Embossed print relief, 0–1                               |
| `layersOn`       | `true`                     | Exploded view: backing paper + foil blank + artwork      |
| `layerDepth`     | `0.002`                    | Separation between exploded layers, 0–0.3                |
| `layerMaterials` | `['gloss','auto','matte']` | Material per layer                                       |
| `peelDirection`  | `'top-right'`              | Which corner is peeled                                   |
| `peelAmount`     | `0.31`                     | Peel progress, 0–1                                       |
| `curl`           | `0.09`                     | Curl radius, 0.02–0.25                                   |
| `shadow`         | `0`                        | Drop-shadow under the curl, 0–1                          |
| `light`          | `{x:0.65, y:0.7}`          | Key-light position in UV space                           |
| `background`     | `'transparent'`            | `transparent`, `white` or `black`                        |
