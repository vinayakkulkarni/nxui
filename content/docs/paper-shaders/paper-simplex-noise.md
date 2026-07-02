---
title: Simplex Noise
description: A multi-color gradient mapped into smooth, animated curves built as a combination of two Simplex noises. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-simplex-noise
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-simplex-noise.json"
```

## Props

| Prop              | Type                             | Default                                                   | Description                                                             |
| ----------------- | -------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `colors`          | `string[]`                       | `['#4449CF', '#FFD1E0', '#F94446', '#FFD36B', '#FFFFFF']` | Up to 10 base colors blended across the noise field                     |
| `steps-per-color` | `number`                         | `2`                                                       | Number of extra colors between base colors (1 to 10)                    |
| `softness`        | `number`                         | `0`                                                       | Color transition sharpness, 0 = hard edge, 1 = smooth gradient (0 to 1) |
| `speed`           | `number`                         | `0.5`                                                     | Animation speed multiplier (0 freezes)                                  |
| `frame`           | `number`                         | `0`                                                       | Initial/seek frame for deterministic rendering                          |
| `fit`             | `'none' \| 'contain' \| 'cover'` | `'none'`                                                  | How the graphic fits the canvas                                         |
| `scale`           | `number`                         | `0.6`                                                     | Overall zoom level (0.01 to 4)                                          |
| `rotation`        | `number`                         | `0`                                                       | Overall rotation in degrees (0 to 360)                                  |
| `origin-x`        | `number`                         | `0.5`                                                     | Horizontal origin for world positioning (0 to 1)                        |
| `origin-y`        | `number`                         | `0.5`                                                     | Vertical origin for world positioning (0 to 1)                          |
| `offset-x`        | `number`                         | `0`                                                       | Horizontal offset of the graphics center (-1 to 1)                      |
| `offset-y`        | `number`                         | `0`                                                       | Vertical offset of the graphics center (-1 to 1)                        |
| `world-width`     | `number`                         | `0`                                                       | Virtual world width before canvas fitting                               |
| `world-height`    | `number`                         | `0`                                                       | Virtual world height before canvas fitting                              |
| `class`           | `string`                         | —                                                         | Additional CSS classes                                                  |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
