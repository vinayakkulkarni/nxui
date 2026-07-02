---
title: Waves
description: Morphing wave pattern with controllable shape, frequency, amplitude, and spacing. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-waves
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-waves.json"
```

## Props

| Prop           | Type                             | Default     | Description                                        |
| -------------- | -------------------------------- | ----------- | -------------------------------------------------- |
| `color-front`  | `string`                         | `'#ffbb00'` | Foreground color                                   |
| `color-back`   | `string`                         | `'#000000'` | Background color                                   |
| `shape`        | `number`                         | `0`         | Wave shape morph parameter (0 to ~3)               |
| `frequency`    | `number`                         | `0.5`       | Wave frequency (0 to 1)                            |
| `amplitude`    | `number`                         | `0.5`       | Wave amplitude (0 to 1)                            |
| `spacing`      | `number`                         | `1.2`       | Spacing between waves (0.5 to 3)                   |
| `proportion`   | `number`                         | `0.1`       | Wave proportion / blend point (0 to 1)             |
| `softness`     | `number`                         | `0`         | Edge softness for color transitions (0 to 1)       |
| `fit`          | `'none' \| 'contain' \| 'cover'` | `'none'`    | How the graphic fits the canvas                    |
| `scale`        | `number`                         | `0.6`       | Overall zoom level (0.01 to 4)                     |
| `rotation`     | `number`                         | `0`         | Overall rotation in degrees (0 to 360)             |
| `origin-x`     | `number`                         | `0.5`       | Horizontal origin for world positioning (0 to 1)   |
| `origin-y`     | `number`                         | `0.5`       | Vertical origin for world positioning (0 to 1)     |
| `offset-x`     | `number`                         | `0`         | Horizontal offset of the graphics center (-1 to 1) |
| `offset-y`     | `number`                         | `0`         | Vertical offset of the graphics center (-1 to 1)   |
| `world-width`  | `number`                         | `0`         | Virtual world width before canvas fitting          |
| `world-height` | `number`                         | `0`         | Virtual world height before canvas fitting         |
| `class`        | `string`                         | —           | Additional CSS classes                             |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
