---
title: Mesh Gradient
description: A flowing composition of color spots moving along distinct trajectories with organic distortion. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-mesh-gradient
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-mesh-gradient.json"
```

## Props

| Prop            | Type                             | Default                                        | Description                                          |
| --------------- | -------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `colors`        | `string[]`                       | `['#e0eaff', '#241d9a', '#f75092', '#9f50d3']` | Up to 10 color spots blended across the surface      |
| `distortion`    | `number`                         | `0.8`                                          | Power of organic noise distortion (0 to 1)           |
| `swirl`         | `number`                         | `0.1`                                          | Power of vortex distortion (0 to 1)                  |
| `grain-mixer`   | `number`                         | `0`                                            | Strength of grain distortion on shape edges (0 to 1) |
| `grain-overlay` | `number`                         | `0`                                            | Post-processing black/white grain overlay (0 to 1)   |
| `speed`         | `number`                         | `1`                                            | Animation speed multiplier (0 freezes)               |
| `frame`         | `number`                         | `0`                                            | Initial/seek frame for deterministic rendering       |
| `fit`           | `'none' \| 'contain' \| 'cover'` | `'contain'`                                    | How the graphic fits the canvas                      |
| `scale`         | `number`                         | `1`                                            | Overall zoom level (0.01 to 4)                       |
| `rotation`      | `number`                         | `0`                                            | Overall rotation in degrees (0 to 360)               |
| `origin-x`      | `number`                         | `0.5`                                          | Horizontal origin for world positioning (0 to 1)     |
| `origin-y`      | `number`                         | `0.5`                                          | Vertical origin for world positioning (0 to 1)       |
| `offset-x`      | `number`                         | `0`                                            | Horizontal offset of the graphics center (-1 to 1)   |
| `offset-y`      | `number`                         | `0`                                            | Vertical offset of the graphics center (-1 to 1)     |
| `world-width`   | `number`                         | `0`                                            | Virtual world width before canvas fitting            |
| `world-height`  | `number`                         | `0`                                            | Virtual world height before canvas fitting           |
| `class`         | `string`                         | —                                              | Additional CSS classes                               |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
