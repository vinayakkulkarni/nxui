---
title: Swirl
description: Animated bands of color twisting and bending, producing spirals, arcs, and flowing circular patterns. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-swirl
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-swirl.json"
```

## Props

| Prop              | Type                             | Default                             | Description                                                       |
| ----------------- | -------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| `color-back`      | `string`                         | `'#330000'`                         | Background color in any CSS color format                          |
| `colors`          | `string[]`                       | `['#ffd1d1', '#ff8a8a', '#660000']` | Up to 10 stripe colors blended into the swirl                     |
| `band-count`      | `number`                         | `4`                                 | Number of color bands, 0 = concentric ripples (0 to 15)           |
| `twist`           | `number`                         | `0.1`                               | Vortex power, 0 = straight sectoral shapes (0 to 1)               |
| `center`          | `number`                         | `0.2`                               | How far from the center the swirl colors begin to appear (0 to 1) |
| `proportion`      | `number`                         | `0.5`                               | Blend point between colors, 0.5 = equal distribution (0 to 1)     |
| `softness`        | `number`                         | `0`                                 | Color transition sharpness, 0 = hard edge, 1 = smooth gradient    |
| `noise-frequency` | `number`                         | `0.4`                               | Noise frequency, no effect with noise = 0 (0 to 1)                |
| `noise`           | `number`                         | `0.2`                               | Strength of noise distortion, no effect with noiseFrequency = 0   |
| `speed`           | `number`                         | `0.32`                              | Animation speed multiplier (0 freezes)                            |
| `frame`           | `number`                         | `0`                                 | Initial/seek frame for deterministic rendering                    |
| `fit`             | `'none' \| 'contain' \| 'cover'` | `'contain'`                         | How the graphic fits the canvas                                   |
| `scale`           | `number`                         | `1`                                 | Overall zoom level (0.01 to 4)                                    |
| `rotation`        | `number`                         | `0`                                 | Overall rotation in degrees (0 to 360)                            |
| `origin-x`        | `number`                         | `0.5`                               | Horizontal origin for world positioning (0 to 1)                  |
| `origin-y`        | `number`                         | `0.5`                               | Vertical origin for world positioning (0 to 1)                    |
| `offset-x`        | `number`                         | `0`                                 | Horizontal offset of the graphics center (-1 to 1)                |
| `offset-y`        | `number`                         | `0`                                 | Vertical offset of the graphics center (-1 to 1)                  |
| `world-width`     | `number`                         | `0`                                 | Virtual world width before canvas fitting                         |
| `world-height`    | `number`                         | `0`                                 | Virtual world height before canvas fitting                        |
| `class`           | `string`                         | —                                   | Additional CSS classes                                            |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
