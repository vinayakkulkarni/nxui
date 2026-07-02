---
title: Paper Texture
description: A static texture built from multiple noise layers, usable for realistic paper and cardboard surfaces. Can be used as an image filter or as a standalone texture. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-texture
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-texture.json"
```

## Props

| Prop           | Type                             | Default     | Description                                                             |
| -------------- | -------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `image`        | `string`                         | `''`        | Optional source image URL — when set, the texture is composited over it |
| `color-front`  | `string`                         | `'#9fadbc'` | Foreground color in RGBA                                                |
| `color-back`   | `string`                         | `'#ffffff'` | Background color in RGBA                                                |
| `contrast`     | `number`                         | `0.3`       | Sharpness of color transitions (0 to 1)                                 |
| `roughness`    | `number`                         | `0.4`       | Pixel noise, related to canvas and not scalable (0 to 1)                |
| `fiber`        | `number`                         | `0.3`       | Curly-shaped noise intensity (0 to 1)                                   |
| `fiber-size`   | `number`                         | `0.2`       | Curly-shaped noise scale (0 to 1)                                       |
| `crumples`     | `number`                         | `0.3`       | Cell-based crumple pattern intensity (0 to 1)                           |
| `crumple-size` | `number`                         | `0.35`      | Cell-based crumple pattern scale (0 to 1)                               |
| `folds`        | `number`                         | `0.65`      | Depth of the folds (0 to 1)                                             |
| `fold-count`   | `number`                         | `5`         | Number of folds (1 to 15)                                               |
| `fade`         | `number`                         | `0`         | Big-scale noise mask applied to the pattern (0 to 1)                    |
| `drops`        | `number`                         | `0.2`       | Visibility of speckle pattern (0 to 1)                                  |
| `seed`         | `number`                         | `5.8`       | Seed applied to folds, crumples and dots (0 to 1000)                    |
| `speed`        | `number`                         | `0`         | Animation speed multiplier (0 freezes)                                  |
| `frame`        | `number`                         | `0`         | Initial/seek frame for deterministic rendering                          |
| `fit`          | `'none' \| 'contain' \| 'cover'` | `'cover'`   | How the graphic fits the canvas                                         |
| `scale`        | `number`                         | `0.6`       | Overall zoom level (0.01 to 4)                                          |
| `rotation`     | `number`                         | `0`         | Overall rotation in degrees (0 to 360)                                  |
| `origin-x`     | `number`                         | `0.5`       | Horizontal origin for world positioning (0 to 1)                        |
| `origin-y`     | `number`                         | `0.5`       | Vertical origin for world positioning (0 to 1)                          |
| `offset-x`     | `number`                         | `0`         | Horizontal offset of the graphics center (-1 to 1)                      |
| `offset-y`     | `number`                         | `0`         | Vertical offset of the graphics center (-1 to 1)                        |
| `world-width`  | `number`                         | `0`         | Virtual world width before canvas fitting                               |
| `world-height` | `number`                         | `0`         | Virtual world height before canvas fitting                              |
| `class`        | `string`                         | —           | Additional CSS classes                                                  |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
