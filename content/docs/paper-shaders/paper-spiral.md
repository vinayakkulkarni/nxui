---
title: Spiral
description: Configurable spiral with stroke width, taper, cap, density, and optional noise distortion. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-spiral
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-spiral.json"
```

## Props

| Prop              | Type                             | Default     | Description                                                |
| ----------------- | -------------------------------- | ----------- | ---------------------------------------------------------- |
| `color-back`      | `string`                         | `'#001429'` | Background color                                           |
| `color-front`     | `string`                         | `'#79D1FF'` | Foreground (spiral stroke) color                           |
| `density`         | `number`                         | `1`         | Spiral arm density (0 to 1)                                |
| `distortion`      | `number`                         | `0`         | Strength of distortion applied to the spiral path (0 to 1) |
| `stroke-width`    | `number`                         | `0.5`       | Spiral stroke width (0 to 1)                               |
| `stroke-taper`    | `number`                         | `0`         | How much the stroke tapers toward the center (0 to 1)      |
| `stroke-cap`      | `number`                         | `0`         | Stroke cap extension length (0 to 1)                       |
| `noise`           | `number`                         | `0`         | Strength of the procedural noise displacement (0 to 1)     |
| `noise-frequency` | `number`                         | `0`         | Frequency of the noise displacement (0 to 1)               |
| `softness`        | `number`                         | `0`         | Edge softness of the spiral stroke (0 to 1)                |
| `speed`           | `number`                         | `1`         | Animation speed multiplier (0 freezes)                     |
| `frame`           | `number`                         | `0`         | Initial/seek frame for deterministic rendering             |
| `fit`             | `'none' \| 'contain' \| 'cover'` | `'none'`    | How the graphic fits the canvas                            |
| `scale`           | `number`                         | `1`         | Overall zoom level (0.01 to 4)                             |
| `rotation`        | `number`                         | `0`         | Overall rotation in degrees (0 to 360)                     |
| `origin-x`        | `number`                         | `0.5`       | Horizontal origin for world positioning (0 to 1)           |
| `origin-y`        | `number`                         | `0.5`       | Vertical origin for world positioning (0 to 1)             |
| `offset-x`        | `number`                         | `0`         | Horizontal offset of the graphics center (-1 to 1)         |
| `offset-y`        | `number`                         | `0`         | Vertical offset of the graphics center (-1 to 1)           |
| `world-width`     | `number`                         | `0`         | Virtual world width before canvas fitting                  |
| `world-height`    | `number`                         | `0`         | Virtual world height before canvas fitting                 |
| `class`           | `string`                         | —           | Additional CSS classes                                     |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
