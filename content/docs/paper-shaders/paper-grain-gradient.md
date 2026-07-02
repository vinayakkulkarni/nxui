---
title: Grain Gradient
description: Multi-color gradients with grainy, noise-textured distortion available in 7 animated abstract forms. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-grain-gradient
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-grain-gradient.json"
```

## Props

| Prop           | Type                                                                           | Default                                        | Description                                           |
| -------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------- |
| `color-back`   | `string`                                                                       | `'#000000'`                                    | Background color in any CSS color format              |
| `colors`       | `string[]`                                                                     | `['#7300ff', '#eba8ff', '#00bfff', '#2a00ff']` | Up to 7 gradient colors blended across the surface    |
| `softness`     | `number`                                                                       | `0.5`                                          | Color transition sharpness, 0 = hard edge, 1 = smooth |
| `intensity`    | `number`                                                                       | `0.5`                                          | Distortion between color bands (0 to 1)               |
| `noise`        | `number`                                                                       | `0.25`                                         | Grainy noise overlay (0 to 1)                         |
| `shape`        | `'wave' \| 'dots' \| 'truchet' \| 'corners' \| 'ripple' \| 'blob' \| 'sphere'` | `'corners'`                                    | Shape type used to drive the gradient field           |
| `speed`        | `number`                                                                       | `1`                                            | Animation speed multiplier (0 freezes)                |
| `frame`        | `number`                                                                       | `0`                                            | Initial/seek frame for deterministic rendering        |
| `fit`          | `'none' \| 'contain' \| 'cover'`                                               | `'contain'`                                    | How the graphic fits the canvas                       |
| `scale`        | `number`                                                                       | `1`                                            | Overall zoom level (0.01 to 4)                        |
| `rotation`     | `number`                                                                       | `0`                                            | Overall rotation in degrees (0 to 360)                |
| `origin-x`     | `number`                                                                       | `0.5`                                          | Horizontal origin for world positioning (0 to 1)      |
| `origin-y`     | `number`                                                                       | `0.5`                                          | Vertical origin for world positioning (0 to 1)        |
| `offset-x`     | `number`                                                                       | `0`                                            | Horizontal offset of the graphics center (-1 to 1)    |
| `offset-y`     | `number`                                                                       | `0`                                            | Vertical offset of the graphics center (-1 to 1)      |
| `world-width`  | `number`                                                                       | `0`                                            | Virtual world width before canvas fitting             |
| `world-height` | `number`                                                                       | `0`                                            | Virtual world height before canvas fitting            |
| `class`        | `string`                                                                       | —                                              | Additional CSS classes                                |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
