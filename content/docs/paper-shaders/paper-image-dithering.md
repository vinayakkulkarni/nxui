---
title: Image Dithering
description: A dithering image filter with support for 4 dithering modes and multiple color palettes — 2-color, 3-color, and multicolor options, using either predefined colors or colors sampled from the original image. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-image-dithering
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-image-dithering.json"
```

## Props

| Prop              | Type                                  | Default     | Description                                                                                  |
| ----------------- | ------------------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `image`           | `string`                              | `''`        | Source image URL — required, the dithering filter is applied to this image                   |
| `color-front`     | `string`                              | `'#94ffaf'` | Foreground color in RGBA                                                                     |
| `color-back`      | `string`                              | `'#000c38'` | Background color in RGBA                                                                     |
| `color-highlight` | `string`                              | `'#eaff94'` | Secondary foreground color in RGBA (set same as colorFront for classic 2-color dithering)    |
| `type`            | `'random' \| '2x2' \| '4x4' \| '8x8'` | `'8x8'`     | Dithering type                                                                               |
| `size`            | `number`                              | `2`         | Pixel size of dithering grid (0.5 to 20)                                                     |
| `color-steps`     | `number`                              | `2`         | Number of colors to use, applies to both color modes (1 to 7)                                |
| `original-colors` | `boolean`                             | `false`     | Use the original colors of the image instead of the color palette                            |
| `inverted`        | `boolean`                             | `false`     | Inverts the image luminance, doesn't affect the color scheme; not effective at zero contrast |
| `speed`           | `number`                              | `0`         | Animation speed multiplier (0 freezes)                                                       |
| `frame`           | `number`                              | `0`         | Initial/seek frame for deterministic rendering                                               |
| `fit`             | `'none' \| 'contain' \| 'cover'`      | `'cover'`   | How the graphic fits the canvas                                                              |
| `scale`           | `number`                              | `1`         | Overall zoom level (0.01 to 4)                                                               |
| `rotation`        | `number`                              | `0`         | Overall rotation in degrees (0 to 360)                                                       |
| `origin-x`        | `number`                              | `0.5`       | Horizontal origin for world positioning (0 to 1)                                             |
| `origin-y`        | `number`                              | `0.5`       | Vertical origin for world positioning (0 to 1)                                               |
| `offset-x`        | `number`                              | `0`         | Horizontal offset of the graphics center (-1 to 1)                                           |
| `offset-y`        | `number`                              | `0`         | Vertical offset of the graphics center (-1 to 1)                                             |
| `world-width`     | `number`                              | `0`         | Virtual world width before canvas fitting                                                    |
| `world-height`    | `number`                              | `0`         | Virtual world height before canvas fitting                                                   |
| `class`           | `string`                              | —           | Additional CSS classes                                                                       |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
