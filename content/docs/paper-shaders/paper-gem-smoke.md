---
title: Gem Smoke
description: Animated color fields placed over an uploaded logo shape with smoky noise behind the glassy shape. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-gem-smoke
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-gem-smoke.json"
```

## Props

| Prop               | Type                                                        | Default                  | Description                                          |
| ------------------ | ----------------------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| `colors`           | `string[]`                                                  | `['#333333', '#e7e6df']` | Up to 6 smoke colors in RGBA                         |
| `color-back`       | `string`                                                    | `'#f0efea'`              | Background color in RGBA                             |
| `color-inner`      | `string`                                                    | `'#fafaf5'`              | Additional color inside the input shape (RGBA)       |
| `image`            | `string`                                                    | `''`                     | Source image URL used as the effect mask             |
| `inner-distortion` | `number`                                                    | `0.8`                    | Power of smoke distortion inside the shape (0 to 1)  |
| `outer-distortion` | `number`                                                    | `0.6`                    | Power of smoke distortion outside the shape (0 to 1) |
| `outer-glow`       | `number`                                                    | `0.55`                   | Visibility of smoke outside the shape (0 to 1)       |
| `inner-glow`       | `number`                                                    | `1`                      | Visibility of smoke inside the shape (0 to 1)        |
| `offset`           | `number`                                                    | `0`                      | Vertical offset of smoke inside the shape (-1 to 1)  |
| `angle`            | `number`                                                    | `0`                      | Smoke direction in degrees                           |
| `size`             | `number`                                                    | `0.8`                    | Size of smoke shape relative to the image box        |
| `shape`            | `'none' \| 'circle' \| 'daisy' \| 'diamond' \| 'metaballs'` | `'diamond'`              | Predefined shape when no image is provided           |
| `speed`            | `number`                                                    | `1`                      | Animation speed multiplier (0 freezes)               |
| `frame`            | `number`                                                    | `0`                      | Initial/seek frame for deterministic rendering       |
| `fit`              | `'none' \| 'contain' \| 'cover'`                            | `'contain'`              | How the graphic fits the canvas                      |
| `scale`            | `number`                                                    | `0.6`                    | Overall zoom level (0.01 to 4)                       |
| `rotation`         | `number`                                                    | `0`                      | Overall rotation in degrees (0 to 360)               |
| `origin-x`         | `number`                                                    | `0.5`                    | Horizontal origin for world positioning (0 to 1)     |
| `origin-y`         | `number`                                                    | `0.5`                    | Vertical origin for world positioning (0 to 1)       |
| `offset-x`         | `number`                                                    | `0`                      | Horizontal offset of the graphics center (-1 to 1)   |
| `offset-y`         | `number`                                                    | `0`                      | Vertical offset of the graphics center (-1 to 1)     |
| `world-width`      | `number`                                                    | `0`                      | Virtual world width before canvas fitting            |
| `world-height`     | `number`                                                    | `0`                      | Virtual world height before canvas fitting           |
| `class`            | `string`                                                    | —                        | Additional CSS classes                               |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
