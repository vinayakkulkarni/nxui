---
title: God Rays
description: Volumetric light rays with configurable colors, density, intensity, and bloom highlight. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-god-rays
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-god-rays.json"
```

## Props

| Prop            | Type                             | Default                                            | Description                                        |
| --------------- | -------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `color-bloom`   | `string`                         | `'#0000ff'`                                        | Bloom highlight color blended at ray peaks         |
| `color-back`    | `string`                         | `'#000000'`                                        | Background color filling the gaps between rays     |
| `colors`        | `string[]`                       | `['#a600ff6e', '#6200fff0', '#ffffff', '#33fff5']` | Up to 10 ray colors blending along the ray field   |
| `density`       | `number`                         | `0.3`                                              | Ray density / count (0 to 1)                       |
| `spotty`        | `number`                         | `0.3`                                              | How spotty / irregular the rays appear (0 to 1)    |
| `mid-intensity` | `number`                         | `0.4`                                              | Strength of the mid-ray intensity (0 to 1)         |
| `mid-size`      | `number`                         | `0.2`                                              | Size of the mid-ray region (0 to 1)                |
| `intensity`     | `number`                         | `0.8`                                              | Overall ray intensity (0 to 1)                     |
| `bloom`         | `number`                         | `0.4`                                              | Bloom strength applied to bright peaks (0 to 1)    |
| `speed`         | `number`                         | `0.75`                                             | Animation speed multiplier (0 freezes)             |
| `frame`         | `number`                         | `0`                                                | Initial/seek frame for deterministic rendering     |
| `fit`           | `'none' \| 'contain' \| 'cover'` | `'contain'`                                        | How the graphic fits the canvas                    |
| `scale`         | `number`                         | `1`                                                | Overall zoom level (0.01 to 4)                     |
| `rotation`      | `number`                         | `0`                                                | Overall rotation in degrees (0 to 360)             |
| `origin-x`      | `number`                         | `0.5`                                              | Horizontal origin for world positioning (0 to 1)   |
| `origin-y`      | `number`                         | `0.5`                                              | Vertical origin for world positioning (0 to 1)     |
| `offset-x`      | `number`                         | `0`                                                | Horizontal offset of the graphics center (-1 to 1) |
| `offset-y`      | `number`                         | `-0.55`                                            | Vertical offset of the graphics center (-1 to 1)   |
| `world-width`   | `number`                         | `0`                                                | Virtual world width before canvas fitting          |
| `world-height`  | `number`                         | `0`                                                | Virtual world height before canvas fitting         |
| `class`         | `string`                         | —                                                  | Additional CSS classes                             |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
