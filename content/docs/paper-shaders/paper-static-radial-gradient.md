---
title: Static Radial Gradient
description: A static radial gradient with up to 10 blended colors, advanced mixing modes, focal point controls, and grain effects. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-static-radial-gradient
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-static-radial-gradient.json"
```

## Props

| Prop               | Type                             | Default                             | Description                                                           |
| ------------------ | -------------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `color-back`       | `string`                         | `'#000000'`                         | Background color behind the gradient                                  |
| `colors`           | `string[]`                       | `['#00bbff', '#00ffe1', '#ffffff']` | Up to 10 colors blended radially across the surface                   |
| `radius`           | `number`                         | `0.8`                               | Size of the radial shape (0 to 3)                                     |
| `focal-distance`   | `number`                         | `0.99`                              | Distance of the focal point from center (0 to 3)                      |
| `focal-angle`      | `number`                         | `0`                                 | Angle of the focal point in degrees, effective with focalDistance > 0 |
| `falloff`          | `number`                         | `0.24`                              | Gradient decay, 0 = linear gradient (-1 to 1)                         |
| `mixing`           | `number`                         | `0.5`                               | Blending behavior, 0 = hard stripes, 1 = smooth gradient (0 to 1)     |
| `distortion`       | `number`                         | `0`                                 | Strength of radial distortion (0 to 1)                                |
| `distortion-shift` | `number`                         | `0`                                 | Radial distortion offset, effective with distortion > 0 (-1 to 1)     |
| `distortion-freq`  | `number`                         | `12`                                | Radial distortion frequency, effective with distortion > 0 (0 to 20)  |
| `grain-mixer`      | `number`                         | `0`                                 | Strength of grain distortion on shape edges (0 to 1)                  |
| `grain-overlay`    | `number`                         | `0`                                 | Post-processing black/white grain overlay (0 to 1)                    |
| `speed`            | `number`                         | `0`                                 | Animation speed multiplier (0 freezes)                                |
| `frame`            | `number`                         | `0`                                 | Initial/seek frame for deterministic rendering                        |
| `fit`              | `'none' \| 'contain' \| 'cover'` | `'contain'`                         | How the graphic fits the canvas                                       |
| `scale`            | `number`                         | `1`                                 | Overall zoom level (0.01 to 4)                                        |
| `rotation`         | `number`                         | `0`                                 | Overall rotation in degrees (0 to 360)                                |
| `origin-x`         | `number`                         | `0.5`                               | Horizontal origin for world positioning (0 to 1)                      |
| `origin-y`         | `number`                         | `0.5`                               | Vertical origin for world positioning (0 to 1)                        |
| `offset-x`         | `number`                         | `0`                                 | Horizontal offset of the graphics center (-1 to 1)                    |
| `offset-y`         | `number`                         | `0`                                 | Vertical offset of the graphics center (-1 to 1)                      |
| `world-width`      | `number`                         | `0`                                 | Virtual world width before canvas fitting                             |
| `world-height`     | `number`                         | `0`                                 | Virtual world height before canvas fitting                            |
| `class`            | `string`                         | —                                   | Additional CSS classes                                                |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
