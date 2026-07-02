---
title: Halftone Dots
description: A halftone-dot image filter featuring customizable grids, color palettes, and dot styles. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-halftone-dots
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-halftone-dots.json"
```

## Props

| Prop              | Type                                        | Default     | Description                                          |
| ----------------- | ------------------------------------------- | ----------- | ---------------------------------------------------- |
| `image`           | `string`                                    | `''`        | Source image URL to apply the halftone filter to     |
| `color-front`     | `string`                                    | `'#2b2b2b'` | Foreground (dot) color in RGBA                       |
| `color-back`      | `string`                                    | `'#f2f1e8'` | Background (paper) color in RGBA                     |
| `size`            | `number`                                    | `0.5`       | Grid size relative to the image box (0 to 1)         |
| `grid`            | `'square' \| 'hex'`                         | `'hex'`     | Grid style                                           |
| `radius`          | `number`                                    | `1.25`      | Maximum dot size relative to grid cell (0 to 2)      |
| `contrast`        | `number`                                    | `0.4`       | Contrast applied to the sampled image (0 to 1)       |
| `original-colors` | `boolean`                                   | `false`     | Use sampled image's original colors                  |
| `inverted`        | `boolean`                                   | `false`     | Inverts the image luminance                          |
| `grain-mixer`     | `number`                                    | `0.2`       | Strength of grain distortion on shape edges (0 to 1) |
| `grain-overlay`   | `number`                                    | `0.2`       | Post-processing black/white grain overlay (0 to 1)   |
| `grain-size`      | `number`                                    | `0.5`       | Scale applied to grain effects (0 to 1)              |
| `type`            | `'classic' \| 'gooey' \| 'holes' \| 'soft'` | `'gooey'`   | Dot style                                            |
| `speed`           | `number`                                    | `0`         | Animation speed multiplier (0 freezes)               |
| `frame`           | `number`                                    | `0`         | Initial/seek frame for deterministic rendering       |
| `fit`             | `'none' \| 'contain' \| 'cover'`            | `'cover'`   | How the graphic fits the canvas                      |
| `scale`           | `number`                                    | `1`         | Overall zoom level (0.01 to 4)                       |
| `rotation`        | `number`                                    | `0`         | Overall rotation in degrees (0 to 360)               |
| `origin-x`        | `number`                                    | `0.5`       | Horizontal origin for world positioning (0 to 1)     |
| `origin-y`        | `number`                                    | `0.5`       | Vertical origin for world positioning (0 to 1)       |
| `offset-x`        | `number`                                    | `0`         | Horizontal offset of the graphics center (-1 to 1)   |
| `offset-y`        | `number`                                    | `0`         | Vertical offset of the graphics center (-1 to 1)     |
| `world-width`     | `number`                                    | `0`         | Virtual world width before canvas fitting            |
| `world-height`    | `number`                                    | `0`         | Virtual world height before canvas fitting           |
| `class`           | `string`                                    | —           | Additional CSS classes                               |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
