---
title: Water
description: Water-like surface distortion with natural caustic realism. Works as an image filter or standalone animated texture. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-water
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-water.json"
```

## Props

| Prop              | Type                             | Default     | Description                                                                   |
| ----------------- | -------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `image`           | `string`                         | `''`        | Optional source image URL — when set, the water distortion is applied over it |
| `color-back`      | `string`                         | `'#909090'` | Background color in RGBA                                                      |
| `color-highlight` | `string`                         | `'#ffffff'` | Highlight color in RGBA                                                       |
| `highlights`      | `number`                         | `0.07`      | Coloring added over image/background following caustic shape (0 to 1)         |
| `layering`        | `number`                         | `0.5`       | Power of 2nd layer of caustic distortion (0 to 1)                             |
| `edges`           | `number`                         | `0.8`       | Caustic distortion power on the image edges (0 to 1)                          |
| `caustic`         | `number`                         | `0.1`       | Power of caustic distortion (0 to 1)                                          |
| `waves`           | `number`                         | `0.3`       | Additional distortion based on simplex noise (0 to 1)                         |
| `size`            | `number`                         | `1`         | Pattern scale relative to the image (0.01 to 7)                               |
| `speed`           | `number`                         | `1`         | Animation speed multiplier (0 freezes)                                        |
| `frame`           | `number`                         | `0`         | Initial/seek frame for deterministic rendering                                |
| `fit`             | `'none' \| 'contain' \| 'cover'` | `'contain'` | How the graphic fits the canvas                                               |
| `scale`           | `number`                         | `0.8`       | Overall zoom level (0.01 to 4)                                                |
| `rotation`        | `number`                         | `0`         | Overall rotation in degrees (0 to 360)                                        |
| `origin-x`        | `number`                         | `0.5`       | Horizontal origin for world positioning (0 to 1)                              |
| `origin-y`        | `number`                         | `0.5`       | Vertical origin for world positioning (0 to 1)                                |
| `offset-x`        | `number`                         | `0`         | Horizontal offset of the graphics center (-1 to 1)                            |
| `offset-y`        | `number`                         | `0`         | Vertical offset of the graphics center (-1 to 1)                              |
| `world-width`     | `number`                         | `0`         | Virtual world width before canvas fitting                                     |
| `world-height`    | `number`                         | `0`         | Virtual world height before canvas fitting                                    |
| `class`           | `string`                         | —           | Additional CSS classes                                                        |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
