---
title: Paper Texture
description: A static paper texture built from grain, fiber, wrinkles, crumples, folds and drops. Works as a filter that bends and blends an image into the sheet, or as a standalone texture. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-texture
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-texture.json"
```

## Usage

```vue
<script setup lang="ts">
  import PaperTexture from '~/components/ui/paper-texture/PaperTexture.vue';
  import { getPaperTexturePreset } from '~/components/ui/paper-texture/paper-texture-presets';
</script>

<template>
  <div class="relative h-100 w-full overflow-hidden rounded-lg">
    <PaperTexture
      image="/flowers.webp"
      v-bind="getPaperTexturePreset('Creased').params"
    />
  </div>
</template>
```

## Presets

The four upstream presets ship in `paper-texture-presets.ts`. Each one sets every prop below except `image` and `class`.

| Preset    | Look                                                |
| --------- | --------------------------------------------------- |
| `Default` | Wrinkled sheet with soft folds and drops            |
| `Spread`  | Translucent sheet with deep folds, clipped          |
| `Creased` | Irregular crumple lines, image pushed inward        |
| `Flat`    | Flat laid paper with heavy grain and fiber, no fold |

`paperTexturePresets` holds all four in upstream order. `getPaperTexturePreset(name)` returns one by name.

## Props

| Prop | Type | Default | Description |
| ---------------- | ----------- | ------------------------------------------------------------------------------------ |
| `image` | `string` | `''` | Optional source image URL. Without it the shader renders a standalone paper sheet |
| `color-back` | `string` | `'#d3d2ab'` | Color behind the paper sheet in RGBA |
| `color-paper` | `string` | `'#ffffff'` | Color of the paper sheet in RGBA |
| `color-shadow` | `string` | `'#cccccc'` | Color of the patterns over the paper sheet in RGBA |
| `blending` | `number` | `1` | Amount of image-to-paper blending, needs image (0 to 1) |
| `distortion` | `number` | `0.75` | How much the image bends with the paper surface, needs image (-1 to 1) |
| `clip` | `boolean` | `false` | Cuts the paper sheet to the image frame, needs image |
| `angle` | `number` | `300` | Direction the surface is lit from in degrees, also the roughness rows direction |
| `seed` | `number` | `4` | Seed applied to every pattern (0 to 1000) |
| `roughness` | `number` | `0.4` | Fine grain covering the surface evenly (0 to 1) |
| `roughness-size` | `number` | `0.5` | Scale of the roughness grain, needs roughness > 0 (0 to 1) |
| `roughness-rows` | `number` | `0` | Lines the roughness up into stripes: 0 = even scatter, 1 = laid-paper rows (0 to 1) |
| `fiber` | `number` | `0.4` | Curly thread-like noise covering the surface evenly (0 to 1) |
| `fiber-size` | `number` | `0.5` | Scale of the fiber noise, needs fiber > 0 (0 to 1) |
| `folds` | `number` | `0.5` | Straight vertical and horizontal fold lines producing ridges and valleys (0 to 1) |
| `fold-size-x` | `number` | `1` | Size of the vertical folds, needs folds > 0 (0 to 1) |
| `fold-size-y` | `number` | `1` | Size of the horizontal folds, needs folds > 0 (0 to 1) |
| `fold-offset-x` | `number` | `0` | Shifts the vertical folds across the surface, needs folds > 0 (0 to 1) |
| `fold-offset-y` | `number` | `0` | Shifts the horizontal folds across the surface, needs folds > 0 (0 to 1) |
| `wrinkles` | `number` | `1` | Crumple-like facets repeating across the surface (0 to 1) |
| `wrinkle-size` | `number` | `0.65` | Scale of the wrinkle facets, needs wrinkles > 0 (0 to 1) |
| `crumples` | `number` | `0` | A set of irregular folding lines (0 to 1) |
| `crumple-count` | `number` | `6` | Number of facets in the crumple field, needs crumples > 0 (2 to 15) |
| `drops` | `number` | `0.4` | Visibility of the speckle pattern; darkens the image instead of coloring it (0 to 1) |
| `speed` | `number` | `0` | Animation speed multiplier (0 freezes) |
| `frame` | `number` | `0` | Initial/seek frame for deterministic rendering |
| `fit` | `'none' \| 'contain' \| 'cover'` | `'contain'` | How the graphic fits the canvas |
| `scale` | `number` | `0.9` | Overall zoom level (0.01 to 4) |
| `rotation` | `number` | `0` | Overall rotation in degrees (0 to 360) |
| `origin-x` | `number` | `0.5` | Horizontal origin for world positioning (0 to 1) |
| `origin-y` | `number` | `0.5` | Vertical origin for world positioning (0 to 1) |
| `offset-x` | `number` | `0` | Horizontal offset of the graphics center (-1 to 1) |
| `offset-y` | `number` | `0` | Vertical offset of the graphics center (-1 to 1) |
| `world-width` | `number` | `0` | Virtual world width before canvas fitting |
| `world-height` | `number` | `0` | Virtual world height before canvas fitting |
| `class` | `string` | — | Additional CSS classes |

The 2.0 shader replaced `color-front`, `contrast`, `crumple-size`, `fold-count` and `fade`. Use `color-paper`/`color-shadow`, `crumple-count` and the new fold, wrinkle and roughness props instead.

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
