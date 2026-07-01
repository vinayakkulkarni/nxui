---
title: Mesh Gradient
description: A flowing composition of color spots moving along organic trajectories, ported from Paper Shaders (Apache-2.0). Proof-of-concept — pending upstream license clarification.
---

::demo-mesh-gradient
::

## Installation

> **Note:** This component is a proof-of-concept and is not yet available via the
> registry CLI pending license clarification with
> [paper-design/shaders](https://github.com/paper-design/shaders).

## Props

| Prop            | Type       | Default                                        | Description                                         |
| --------------- | ---------- | ---------------------------------------------- | --------------------------------------------------- |
| `colors`        | `string[]` | `['#e0eaff', '#241d9a', '#f75092', '#9f50d3']` | Up to 10 hex color spots blended across the surface |
| `speed`         | `number`   | `1`                                            | Animation speed multiplier (set to `0` to freeze)   |
| `distortion`    | `number`   | `0.8`                                          | Power of organic noise distortion (0 to 1)          |
| `swirl`         | `number`   | `0.1`                                          | Power of vortex/swirl distortion (0 to 1)           |
| `grain-mixer`   | `number`   | `0`                                            | Strength of grain distortion applied to shape edges |
| `grain-overlay` | `number`   | `0`                                            | Post-processing black/white grain overlay (0 to 1)  |
| `scale`         | `number`   | `1`                                            | Overall zoom level of the graphics                  |
| `class`         | `string`   | —                                              | Additional CSS classes                              |

## Attribution

The mesh-gradient fragment shader is ported from
[Paper Shaders](https://github.com/paper-design/shaders) (Copyright Lost Coast
Labs, Inc.), licensed under Apache-2.0.
