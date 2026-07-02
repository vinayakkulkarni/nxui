---
title: Color Panels
description: Pseudo-3D semi-transparent panels rotating around a central axis. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-color-panels
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-color-panels.json"
```

## Props

| Prop           | Type                             | Default                                                                         | Description                                                   |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `colors`       | `string[]`                       | `['#ff9d00', '#fd4f30', '#809bff', '#6d2eff', '#333aff', '#f15cff', '#ffd557']` | Up to 7 RGBA colors used to color the panels                  |
| `color-back`   | `string`                         | `'#000000'`                                                                     | Background color in any CSS color format                      |
| `angle1`       | `number`                         | `0`                                                                             | Skew angle applied to all panels (-1 to 1)                    |
| `angle2`       | `number`                         | `0`                                                                             | Skew angle applied to all panels (-1 to 1)                    |
| `length`       | `number`                         | `1.1`                                                                           | Panel length relative to total height (0 to 3)                |
| `edges`        | `boolean`                        | `false`                                                                         | Highlight the panel edges with a brighter rim                 |
| `blur`         | `number`                         | `0`                                                                             | Side blur, 0 for sharp edges (0 to 0.5)                       |
| `fade-in`      | `number`                         | `1`                                                                             | Transparency near the central axis (0 to 1)                   |
| `fade-out`     | `number`                         | `0.3`                                                                           | Transparency near the viewer (0 to 1)                         |
| `density`      | `number`                         | `3`                                                                             | Angle between every 2 panels (0.25 to 7)                      |
| `gradient`     | `number`                         | `0`                                                                             | Color mixing within a panel, 0 = solid, 1 = gradient (0 to 1) |
| `speed`        | `number`                         | `0.5`                                                                           | Animation speed multiplier (0 freezes)                        |
| `frame`        | `number`                         | `0`                                                                             | Initial/seek frame for deterministic rendering                |
| `fit`          | `'none' \| 'contain' \| 'cover'` | `'contain'`                                                                     | How the graphic fits the canvas                               |
| `scale`        | `number`                         | `0.8`                                                                           | Overall zoom level (0.01 to 4)                                |
| `rotation`     | `number`                         | `0`                                                                             | Overall rotation in degrees (0 to 360)                        |
| `origin-x`     | `number`                         | `0.5`                                                                           | Horizontal origin for world positioning (0 to 1)              |
| `origin-y`     | `number`                         | `0.5`                                                                           | Vertical origin for world positioning (0 to 1)                |
| `offset-x`     | `number`                         | `0`                                                                             | Horizontal offset of the graphics center (-1 to 1)            |
| `offset-y`     | `number`                         | `0`                                                                             | Vertical offset of the graphics center (-1 to 1)              |
| `world-width`  | `number`                         | `0`                                                                             | Virtual world width before canvas fitting                     |
| `world-height` | `number`                         | `0`                                                                             | Virtual world height before canvas fitting                    |
| `class`        | `string`                         | —                                                                               | Additional CSS classes                                        |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
