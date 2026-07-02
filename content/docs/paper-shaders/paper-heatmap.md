---
title: Heatmap
description: A glowing gradient of colors flowing through an input shape. The effect creates a smoothly animated wave of intensity across the image. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-heatmap
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-heatmap.json"
```

## Props

| Prop           | Type                             | Default                                                                         | Description                                                                                                                             |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `image`        | `string`                         | `''`                                                                            | Source image URL — required. The image is preprocessed (blurred to feed contour/outer/inner channels) before being passed to the shader |
| `contour`      | `number`                         | `0.5`                                                                           | Heat intensity near the edges of the input shape (0 to 1)                                                                               |
| `angle`        | `number`                         | `0`                                                                             | Direction of the heatwaves in degrees (0 to 360)                                                                                        |
| `noise`        | `number`                         | `0`                                                                             | Grain applied across the entire graphic (0 to 1)                                                                                        |
| `inner-glow`   | `number`                         | `0.5`                                                                           | Size of the heated area inside the input shape (0 to 1)                                                                                 |
| `outer-glow`   | `number`                         | `0.5`                                                                           | Size of the heated area outside the input shape (0 to 1)                                                                                |
| `color-back`   | `string`                         | `'#000000'`                                                                     | Background color in RGBA                                                                                                                |
| `colors`       | `string[]`                       | `['#11206a', '#1f3ba2', '#2f63e7', '#6bd7ff', '#ffe679', '#ff991e', '#ff4c00']` | Up to 10 heatmap colors in RGBA                                                                                                         |
| `speed`        | `number`                         | `1`                                                                             | Animation speed multiplier (0 freezes)                                                                                                  |
| `frame`        | `number`                         | `0`                                                                             | Initial/seek frame for deterministic rendering                                                                                          |
| `fit`          | `'none' \| 'contain' \| 'cover'` | `'contain'`                                                                     | How the graphic fits the canvas                                                                                                         |
| `scale`        | `number`                         | `0.75`                                                                          | Overall zoom level (0.01 to 4)                                                                                                          |
| `rotation`     | `number`                         | `0`                                                                             | Overall rotation in degrees (0 to 360)                                                                                                  |
| `origin-x`     | `number`                         | `0.5`                                                                           | Horizontal origin for world positioning (0 to 1)                                                                                        |
| `origin-y`     | `number`                         | `0.5`                                                                           | Vertical origin for world positioning (0 to 1)                                                                                          |
| `offset-x`     | `number`                         | `0`                                                                             | Horizontal offset of the graphics center (-1 to 1)                                                                                      |
| `offset-y`     | `number`                         | `0`                                                                             | Vertical offset of the graphics center (-1 to 1)                                                                                        |
| `world-width`  | `number`                         | `0`                                                                             | Virtual world width before canvas fitting                                                                                               |
| `world-height` | `number`                         | `0`                                                                             | Virtual world height before canvas fitting                                                                                              |
| `class`        | `string`                         | —                                                                               | Additional CSS classes                                                                                                                  |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
