---
title: Perlin Noise
description: Classic animated 3D Perlin noise with exposed controls for octaves, persistence, and lacunarity. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-perlin-noise
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-perlin-noise.json"
```

## Props

| Prop           | Type                             | Default     | Description                                        |
| -------------- | -------------------------------- | ----------- | -------------------------------------------------- |
| `color-front`  | `string`                         | `'#fccff7'` | Foreground color                                   |
| `color-back`   | `string`                         | `'#632ad5'` | Background color                                   |
| `proportion`   | `number`                         | `0.35`      | Blend point between 2 colors (0 to 1)              |
| `softness`     | `number`                         | `0.1`       | Color transition sharpness (0 = hard, 1 = smooth)  |
| `octave-count` | `number`                         | `1`         | Perlin noise octaves number (1 to 8)               |
| `persistence`  | `number`                         | `1`         | Roughness, falloff between octaves (0.3 to 1)      |
| `lacunarity`   | `number`                         | `1.5`       | Frequency step, pattern compression (1.5 to 10)    |
| `speed`        | `number`                         | `0.5`       | Animation speed multiplier (0 freezes)             |
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
