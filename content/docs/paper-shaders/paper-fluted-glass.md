---
title: Fluted Glass
description: Fluted glass image filter that transforms an image into streaked, ribbed distortions, giving a mix of clarity and obscurity. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-fluted-glass
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-fluted-glass.json"
```

## Props

| Prop               | Type                                                             | Default       | Description                                                                         |
| ------------------ | ---------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| `image`            | `string`                                                         | `''`          | Source image URL — when set, the glass distortion is applied over the image         |
| `color-back`       | `string`                                                         | `'#00000000'` | Background color in RGBA                                                            |
| `color-shadow`     | `string`                                                         | `'#000000'`   | Shadows color in RGBA                                                               |
| `color-highlight`  | `string`                                                         | `'#ffffff'`   | Highlights color in RGBA                                                            |
| `shadows`          | `number`                                                         | `0.25`        | Color gradient added over image and background, following distortion shape (0 to 1) |
| `highlights`       | `number`                                                         | `0.1`         | Thin strokes along distortion shape, useful for antialiasing on small grid (0 to 1) |
| `size`             | `number`                                                         | `0.5`         | Size of the distortion shape grid (0 to 1)                                          |
| `angle`            | `number`                                                         | `0`           | Direction of the grid relative to the image in degrees (0 to 180)                   |
| `distortion`       | `number`                                                         | `0.5`         | Power of distortion applied within each stripe (0 to 1)                             |
| `distortion-shape` | `'prism' \| 'lens' \| 'contour' \| 'cascade' \| 'flat'`          | `'prism'`     | Glass distortion shape                                                              |
| `shape`            | `'lines' \| 'linesIrregular' \| 'wave' \| 'zigzag' \| 'pattern'` | `'lines'`     | Grid shape                                                                          |
| `shift`            | `number`                                                         | `0`           | Texture shift in direction opposite to the grid (-1 to 1)                           |
| `blur`             | `number`                                                         | `0`           | One-directional blur over the image and extra blur around edges (0 to 1)            |
| `edges`            | `number`                                                         | `0.25`        | Glass distortion and softness on the image edges (0 to 1)                           |
| `margin-left`      | `number`                                                         | `0`           | Distance from the left edge to the effect (0 to 1)                                  |
| `margin-right`     | `number`                                                         | `0`           | Distance from the right edge to the effect (0 to 1)                                 |
| `margin-top`       | `number`                                                         | `0`           | Distance from the top edge to the effect (0 to 1)                                   |
| `margin-bottom`    | `number`                                                         | `0`           | Distance from the bottom edge to the effect (0 to 1)                                |
| `stretch`          | `number`                                                         | `0`           | Extra distortion along the grid lines (0 to 1)                                      |
| `grain-mixer`      | `number`                                                         | `0`           | Strength of grain distortion applied to shape edges (0 to 1)                        |
| `grain-overlay`    | `number`                                                         | `0`           | Post-processing black/white grain overlay (0 to 1)                                  |
| `speed`            | `number`                                                         | `0`           | Animation speed multiplier (0 freezes)                                              |
| `frame`            | `number`                                                         | `0`           | Initial/seek frame for deterministic rendering                                      |
| `fit`              | `'none' \| 'contain' \| 'cover'`                                 | `'cover'`     | How the graphic fits the canvas                                                     |
| `scale`            | `number`                                                         | `1`           | Overall zoom level (0.01 to 4)                                                      |
| `rotation`         | `number`                                                         | `0`           | Overall rotation in degrees (0 to 360)                                              |
| `origin-x`         | `number`                                                         | `0.5`         | Horizontal origin for world positioning (0 to 1)                                    |
| `origin-y`         | `number`                                                         | `0.5`         | Vertical origin for world positioning (0 to 1)                                      |
| `offset-x`         | `number`                                                         | `0`           | Horizontal offset of the graphics center (-1 to 1)                                  |
| `offset-y`         | `number`                                                         | `0`           | Vertical offset of the graphics center (-1 to 1)                                    |
| `world-width`      | `number`                                                         | `0`           | Virtual world width before canvas fitting                                           |
| `world-height`     | `number`                                                         | `0`           | Virtual world height before canvas fitting                                          |
| `class`            | `string`                                                         | —             | Additional CSS classes                                                              |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
