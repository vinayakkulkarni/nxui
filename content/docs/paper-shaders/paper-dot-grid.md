---
title: Dot Grid
description: A static grid pattern made of circles, diamonds, squares, or triangles with adjustable colors, spacing, and size. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-dot-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-dot-grid.json"
```

## Props

| Prop            | Type                                              | Default     | Description                                            |
| --------------- | ------------------------------------------------- | ----------- | ------------------------------------------------------ |
| `color-back`    | `string`                                          | `'#000000'` | Background color behind the shapes                     |
| `color-fill`    | `string`                                          | `'#ffffff'` | Shape fill color                                       |
| `color-stroke`  | `string`                                          | `'#ffaa00'` | Shape stroke color                                     |
| `size`          | `number`                                          | `2`         | Base size of each shape in pixels (1 to 100)           |
| `gap-x`         | `number`                                          | `32`        | Pattern horizontal spacing in pixels (2 to 500)        |
| `gap-y`         | `number`                                          | `32`        | Pattern vertical spacing in pixels (2 to 500)          |
| `stroke-width`  | `number`                                          | `0`         | Outline stroke width in pixels (0 to 50)               |
| `size-range`    | `number`                                          | `0`         | Random variation in shape size, 0 = uniform (0 to 1)   |
| `opacity-range` | `number`                                          | `0`         | Random variation in shape opacity, 0 = opaque (0 to 1) |
| `shape`         | `'circle' \| 'diamond' \| 'square' \| 'triangle'` | `'circle'`  | Shape type rendered in each grid cell                  |
| `speed`         | `number`                                          | `0`         | Animation speed multiplier (0 freezes)                 |
| `frame`         | `number`                                          | `0`         | Initial/seek frame for deterministic rendering         |
| `fit`           | `'none' \| 'contain' \| 'cover'`                  | `'none'`    | How the graphic fits the canvas                        |
| `scale`         | `number`                                          | `1`         | Overall zoom level (0.01 to 4)                         |
| `rotation`      | `number`                                          | `0`         | Overall rotation in degrees (0 to 360)                 |
| `origin-x`      | `number`                                          | `0.5`       | Horizontal origin for world positioning (0 to 1)       |
| `origin-y`      | `number`                                          | `0.5`       | Vertical origin for world positioning (0 to 1)         |
| `offset-x`      | `number`                                          | `0`         | Horizontal offset of the graphics center (-1 to 1)     |
| `offset-y`      | `number`                                          | `0`         | Vertical offset of the graphics center (-1 to 1)       |
| `world-width`   | `number`                                          | `0`         | Virtual world width before canvas fitting              |
| `world-height`  | `number`                                          | `0`         | Virtual world height before canvas fitting             |
| `class`         | `string`                                          | —           | Additional CSS classes                                 |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
