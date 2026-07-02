---
title: Neuro Noise
description: A glowing, web-like structure of fluid lines and soft intersections for atmospheric, organic-yet-futuristic visuals. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-neuro-noise
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-neuro-noise.json"
```

## Props

| Prop           | Type                             | Default     | Description                                        |
| -------------- | -------------------------------- | ----------- | -------------------------------------------------- |
| `color-front`  | `string`                         | `'#ffffff'` | Highlight color at the brightest crossing points   |
| `color-mid`    | `string`                         | `'#47a6ff'` | Main color of the flowing structure                |
| `color-back`   | `string`                         | `'#000000'` | Background color behind the web                    |
| `brightness`   | `number`                         | `0.05`      | Luminosity of the crossing points (0 to 1)         |
| `contrast`     | `number`                         | `0.3`       | Sharpness of the bright-dark transition (0 to 1)   |
| `speed`        | `number`                         | `1`         | Animation speed multiplier (0 freezes)             |
| `frame`        | `number`                         | `0`         | Initial/seek frame for deterministic rendering     |
| `fit`          | `'none' \| 'contain' \| 'cover'` | `'none'`    | How the graphic fits the canvas                    |
| `scale`        | `number`                         | `1`         | Overall zoom level (0.01 to 4)                     |
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

Original algorithm: [Zach Lieberman](https://x.com/zozuar/status/1625182758745128981/).
