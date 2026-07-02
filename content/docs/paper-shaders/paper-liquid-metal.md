---
title: Liquid Metal
description: A futuristic liquid metal material applied to an uploaded logo or abstract shape, with fluid motion distortion along edges. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-liquid-metal
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-liquid-metal.json"
```

## Props

| Prop           | Type                                                        | Default     | Description                                        |
| -------------- | ----------------------------------------------------------- | ----------- | -------------------------------------------------- |
| `color-back`   | `string`                                                    | `'#AAAAAC'` | Background color behind the metal surface          |
| `color-tint`   | `string`                                                    | `'#ffffff'` | Overlay color (color-burn blended)                 |
| `image`        | `string`                                                    | `''`        | Source image URL used as the effect mask           |
| `repetition`   | `number`                                                    | `2`         | Density of pattern stripes (1 to 10)               |
| `shift-red`    | `number`                                                    | `0.3`       | R-channel dispersion (-1 to 1)                     |
| `shift-blue`   | `number`                                                    | `0.3`       | B-channel dispersion (-1 to 1)                     |
| `contour`      | `number`                                                    | `0.4`       | Distortion on shape edges (0 to 1)                 |
| `softness`     | `number`                                                    | `0.1`       | Color transition sharpness (0 to 1)                |
| `distortion`   | `number`                                                    | `0.07`      | Noise distortion over the stripes pattern (0 to 1) |
| `angle`        | `number`                                                    | `70`        | Direction of pattern animation in degrees          |
| `shape`        | `'none' \| 'circle' \| 'daisy' \| 'diamond' \| 'metaballs'` | `'diamond'` | Predefined shape when no image is provided         |
| `speed`        | `number`                                                    | `1`         | Animation speed multiplier (0 freezes)             |
| `frame`        | `number`                                                    | `0`         | Initial/seek frame for deterministic rendering     |
| `fit`          | `'none' \| 'contain' \| 'cover'`                            | `'contain'` | How the graphic fits the canvas                    |
| `scale`        | `number`                                                    | `0.6`       | Overall zoom level (0.01 to 4)                     |
| `rotation`     | `number`                                                    | `0`         | Overall rotation in degrees (0 to 360)             |
| `origin-x`     | `number`                                                    | `0.5`       | Horizontal origin for world positioning (0 to 1)   |
| `origin-y`     | `number`                                                    | `0.5`       | Vertical origin for world positioning (0 to 1)     |
| `offset-x`     | `number`                                                    | `0`         | Horizontal offset of the graphics center (-1 to 1) |
| `offset-y`     | `number`                                                    | `0`         | Vertical offset of the graphics center (-1 to 1)   |
| `world-width`  | `number`                                                    | `0`         | Virtual world width before canvas fitting          |
| `world-height` | `number`                                                    | `0`         | Virtual world height before canvas fitting         |
| `class`        | `string`                                                    | —           | Additional CSS classes                             |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
