---
title: Warp
description: Organic warp distortion of a multi-color field with selectable shape patterns, swirl, and noise distortion. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-warp
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-warp.json"
```

## Props

| Prop               | Type                              | Default                                        | Description                                            |
| ------------------ | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `colors`           | `string[]`                        | `['#121212', '#9470ff', '#121212', '#8838ff']` | Up to 10 color stops blended across the warped surface |
| `proportion`       | `number`                          | `0.45`                                         | Blend point between colors (0 to 1)                    |
| `softness`         | `number`                          | `1`                                            | Edge softness of color transitions (0 to 1)            |
| `distortion`       | `number`                          | `0.25`                                         | Strength of organic noise distortion (0 to 1)          |
| `swirl`            | `number`                          | `0.8`                                          | Power of vortex distortion (0 to 1)                    |
| `swirl-iterations` | `number`                          | `10`                                           | Number of swirl iterations (0 to 20)                   |
| `shape-scale`      | `number`                          | `0.1`                                          | Scale of the pattern shape (0 to 1)                    |
| `shape`            | `'checks' \| 'stripes' \| 'edge'` | `'checks'`                                     | Shape pattern used by the warp                         |
| `speed`            | `number`                          | `1`                                            | Animation speed multiplier (0 freezes)                 |
| `frame`            | `number`                          | `0`                                            | Initial/seek frame for deterministic rendering         |
| `fit`              | `'none' \| 'contain' \| 'cover'`  | `'none'`                                       | How the graphic fits the canvas                        |
| `scale`            | `number`                          | `1`                                            | Overall zoom level (0.01 to 4)                         |
| `rotation`         | `number`                          | `0`                                            | Overall rotation in degrees (0 to 360)                 |
| `origin-x`         | `number`                          | `0.5`                                          | Horizontal origin for world positioning (0 to 1)       |
| `origin-y`         | `number`                          | `0.5`                                          | Vertical origin for world positioning (0 to 1)         |
| `offset-x`         | `number`                          | `0`                                            | Horizontal offset of the graphics center (-1 to 1)     |
| `offset-y`         | `number`                          | `0`                                            | Vertical offset of the graphics center (-1 to 1)       |
| `world-width`      | `number`                          | `0`                                            | Virtual world width before canvas fitting              |
| `world-height`     | `number`                          | `0`                                            | Virtual world height before canvas fitting             |
| `class`            | `string`                          | —                                              | Additional CSS classes                                 |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
