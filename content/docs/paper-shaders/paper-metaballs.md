---
title: Metaballs
description: Up to 20 colored gooey balls moving around the center and merging into smooth organic shapes. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-metaballs
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-metaballs.json"
```

## Props

| Prop           | Type                             | Default                                                   | Description                                        |
| -------------- | -------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| `color-back`   | `string`                         | `'#000000'`                                               | Background color behind the balls                  |
| `colors`       | `string[]`                       | `['#6e33cc', '#ff5500', '#ffc105', '#ffc800', '#f585ff']` | Up to 8 base colors cycled across the balls        |
| `count`        | `number`                         | `10`                                                      | Number of balls (1 to 20)                          |
| `size`         | `number`                         | `0.83`                                                    | Size of the balls (0 to 1)                         |
| `speed`        | `number`                         | `1`                                                       | Animation speed multiplier (0 freezes)             |
| `frame`        | `number`                         | `0`                                                       | Initial/seek frame for deterministic rendering     |
| `fit`          | `'none' \| 'contain' \| 'cover'` | `'contain'`                                               | How the graphic fits the canvas                    |
| `scale`        | `number`                         | `1`                                                       | Overall zoom level (0.01 to 4)                     |
| `rotation`     | `number`                         | `0`                                                       | Overall rotation in degrees (0 to 360)             |
| `origin-x`     | `number`                         | `0.5`                                                     | Horizontal origin for world positioning (0 to 1)   |
| `origin-y`     | `number`                         | `0.5`                                                     | Vertical origin for world positioning (0 to 1)     |
| `offset-x`     | `number`                         | `0`                                                       | Horizontal offset of the graphics center (-1 to 1) |
| `offset-y`     | `number`                         | `0`                                                       | Vertical offset of the graphics center (-1 to 1)   |
| `world-width`  | `number`                         | `0`                                                       | Virtual world width before canvas fitting          |
| `world-height` | `number`                         | `0`                                                       | Virtual world height before canvas fitting         |
| `class`        | `string`                         | —                                                         | Additional CSS classes                             |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
