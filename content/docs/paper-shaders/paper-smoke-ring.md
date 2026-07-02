---
title: Smoke Ring
description: A radial, multi-colored gradient ring shaped with layered noise for a natural, smoky aesthetic. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-smoke-ring
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-smoke-ring.json"
```

## Props

| Prop               | Type                             | Default       | Description                                           |
| ------------------ | -------------------------------- | ------------- | ----------------------------------------------------- |
| `color-back`       | `string`                         | `'#000000'`   | Background color behind the ring                      |
| `colors`           | `string[]`                       | `['#ffffff']` | Up to 10 gradient colors blended across the ring      |
| `noise-scale`      | `number`                         | `3`           | Noise frequency driving the smoky texture (0.01 to 5) |
| `thickness`        | `number`                         | `0.65`        | Thickness of the ring shape (0.01 to 1)               |
| `radius`           | `number`                         | `0.25`        | Radius of the ring shape (0 to 1)                     |
| `inner-shape`      | `number`                         | `0.7`         | Ring inner fill amount (0 to 4)                       |
| `noise-iterations` | `number`                         | `8`           | Number of noise layers stacked for detail (1 to 8)    |
| `speed`            | `number`                         | `0.5`         | Animation speed multiplier (0 freezes)                |
| `frame`            | `number`                         | `0`           | Initial/seek frame for deterministic rendering        |
| `fit`              | `'none' \| 'contain' \| 'cover'` | `'contain'`   | How the graphic fits the canvas                       |
| `scale`            | `number`                         | `0.8`         | Overall zoom level (0.01 to 4)                        |
| `rotation`         | `number`                         | `0`           | Overall rotation in degrees (0 to 360)                |
| `origin-x`         | `number`                         | `0.5`         | Horizontal origin for world positioning (0 to 1)      |
| `origin-y`         | `number`                         | `0.5`         | Vertical origin for world positioning (0 to 1)        |
| `offset-x`         | `number`                         | `0`           | Horizontal offset of the graphics center (-1 to 1)    |
| `offset-y`         | `number`                         | `0`           | Vertical offset of the graphics center (-1 to 1)      |
| `world-width`      | `number`                         | `0`           | Virtual world width before canvas fitting             |
| `world-height`     | `number`                         | `0`           | Virtual world height before canvas fitting            |
| `class`            | `string`                         | —             | Additional CSS classes                                |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
