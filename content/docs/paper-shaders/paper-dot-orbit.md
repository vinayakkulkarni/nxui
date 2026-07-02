---
title: Dot Orbit
description: Animated multi-color dots with each dot orbiting around its cell center. Supports up to 10 colors and a range of shape and motion controls. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-dot-orbit
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-dot-orbit.json"
```

## Props

| Prop              | Type                             | Default                                                   | Description                                                                           |
| ----------------- | -------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `color-back`      | `string`                         | `'#000000'`                                               | Background color behind the dots                                                      |
| `colors`          | `string[]`                       | `['#ffc96b', '#ff6200', '#ff2f00', '#421100', '#1a0000']` | Up to 10 base colors blended across the dots                                          |
| `size`            | `number`                         | `1`                                                       | Dot radius relative to cell size (0 to 1)                                             |
| `size-range`      | `number`                         | `0`                                                       | Random variation in shape size, 0 = uniform, higher = random up to base size (0 to 1) |
| `spreading`       | `number`                         | `1`                                                       | Maximum orbit distance around cell center (0 to 1)                                    |
| `steps-per-color` | `number`                         | `4`                                                       | Number of extra colors between base colors (1 to 4)                                   |
| `speed`           | `number`                         | `1.5`                                                     | Animation speed multiplier (0 freezes)                                                |
| `frame`           | `number`                         | `0`                                                       | Initial/seek frame for deterministic rendering                                        |
| `fit`             | `'none' \| 'contain' \| 'cover'` | `'none'`                                                  | How the graphic fits the canvas                                                       |
| `scale`           | `number`                         | `1`                                                       | Overall zoom level (0.01 to 4)                                                        |
| `rotation`        | `number`                         | `0`                                                       | Overall rotation in degrees (0 to 360)                                                |
| `origin-x`        | `number`                         | `0.5`                                                     | Horizontal origin for world positioning (0 to 1)                                      |
| `origin-y`        | `number`                         | `0.5`                                                     | Vertical origin for world positioning (0 to 1)                                        |
| `offset-x`        | `number`                         | `0`                                                       | Horizontal offset of the graphics center (-1 to 1)                                    |
| `offset-y`        | `number`                         | `0`                                                       | Vertical offset of the graphics center (-1 to 1)                                      |
| `world-width`     | `number`                         | `0`                                                       | Virtual world width before canvas fitting                                             |
| `world-height`    | `number`                         | `0`                                                       | Virtual world height before canvas fitting                                            |
| `class`           | `string`                         | —                                                         | Additional CSS classes                                                                |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
