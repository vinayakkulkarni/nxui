---
title: Static Mesh Gradient
description: Multi-point mesh gradient with up to 10 color spots, enhanced by two-direction warping, adjustable blend sharpness, and grain controls. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-static-mesh-gradient
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-static-mesh-gradient.json"
```

## Props

| Prop            | Type                             | Default                                        | Description                                                             |
| --------------- | -------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `colors`        | `string[]`                       | `['#ffad0a', '#6200ff', '#e2a3ff', '#ff99fd']` | Up to 10 gradient colors blended across the surface                     |
| `positions`     | `number`                         | `2`                                            | Color spots placement seed (0 to 100)                                   |
| `wave-x`        | `number`                         | `1.0`                                          | Strength of sine wave distortion along X axis (0 to 1)                  |
| `wave-x-shift`  | `number`                         | `0.6`                                          | Phase offset applied to the X-axis wave (0 to 1)                        |
| `wave-y`        | `number`                         | `1.0`                                          | Strength of sine wave distortion along Y axis (0 to 1)                  |
| `wave-y-shift`  | `number`                         | `0.21`                                         | Phase offset applied to the Y-axis wave (0 to 1)                        |
| `mixing`        | `number`                         | `0.93`                                         | Blending behavior, 0 = hard stripes, 0.5 = smooth, 1 = gradual (0 to 1) |
| `grain-mixer`   | `number`                         | `0`                                            | Strength of grain distortion applied to shape edges (0 to 1)            |
| `grain-overlay` | `number`                         | `0`                                            | Post-processing black/white grain overlay (0 to 1)                      |
| `speed`         | `number`                         | `0`                                            | Animation speed multiplier (0 freezes)                                  |
| `frame`         | `number`                         | `0`                                            | Initial/seek frame for deterministic rendering                          |
| `fit`           | `'none' \| 'contain' \| 'cover'` | `'contain'`                                    | How the graphic fits the canvas                                         |
| `scale`         | `number`                         | `1`                                            | Overall zoom level (0.01 to 4)                                          |
| `rotation`      | `number`                         | `270`                                          | Overall rotation in degrees (0 to 360)                                  |
| `origin-x`      | `number`                         | `0.5`                                          | Horizontal origin for world positioning (0 to 1)                        |
| `origin-y`      | `number`                         | `0.5`                                          | Vertical origin for world positioning (0 to 1)                          |
| `offset-x`      | `number`                         | `0`                                            | Horizontal offset of the graphics center (-1 to 1)                      |
| `offset-y`      | `number`                         | `0`                                            | Vertical offset of the graphics center (-1 to 1)                        |
| `world-width`   | `number`                         | `0`                                            | Virtual world width before canvas fitting                               |
| `world-height`  | `number`                         | `0`                                            | Virtual world height before canvas fitting                              |
| `class`         | `string`                         | —                                              | Additional CSS classes                                                  |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
