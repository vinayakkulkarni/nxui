---
title: Halftone CMYK
description: A CMYK halftone printing effect applied to images with customizable dot patterns and ink colors for each channel. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-halftone-cmyk
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-halftone-cmyk.json"
```

## Props

| Prop            | Type                             | Default     | Description                                        |
| --------------- | -------------------------------- | ----------- | -------------------------------------------------- |
| `image`         | `string`                         | `''`        | Source image URL to apply the CMYK halftone to     |
| `color-back`    | `string`                         | `'#fbfaf5'` | Background (paper) color in RGBA                   |
| `color-c`       | `string`                         | `'#00b4ff'` | Cyan ink color in RGBA                             |
| `color-m`       | `string`                         | `'#fc519f'` | Magenta ink color in RGBA                          |
| `color-y`       | `string`                         | `'#ffd800'` | Yellow ink color in RGBA                           |
| `color-k`       | `string`                         | `'#231f20'` | Black ink color in RGBA                            |
| `size`          | `number`                         | `0.2`       | Halftone cell size (0 to 1)                        |
| `contrast`      | `number`                         | `1`         | Image contrast adjustment (0 to 2)                 |
| `softness`      | `number`                         | `1`         | Edge softness of dots (0 to 1)                     |
| `grain-size`    | `number`                         | `0.5`       | Size of grain overlay texture (0 to 1)             |
| `grain-mixer`   | `number`                         | `0`         | Strength of grain affecting dot size (0 to 1)      |
| `grain-overlay` | `number`                         | `0`         | Strength of grain overlay on final output (0 to 1) |
| `grid-noise`    | `number`                         | `0.2`       | Strength of smooth noise on dot positions (0 to 1) |
| `flood-c`       | `number`                         | `0.15`      | Flat cyan dot size adjustment (-1 to 1)            |
| `flood-m`       | `number`                         | `0`         | Flat magenta dot size adjustment (-1 to 1)         |
| `flood-y`       | `number`                         | `0`         | Flat yellow dot size adjustment (-1 to 1)          |
| `flood-k`       | `number`                         | `0`         | Flat black dot size adjustment (-1 to 1)           |
| `gain-c`        | `number`                         | `0.3`       | Proportional cyan dot size gain (-1 to 1)          |
| `gain-m`        | `number`                         | `0`         | Proportional magenta dot size gain (-1 to 1)       |
| `gain-y`        | `number`                         | `0.2`       | Proportional yellow dot size gain (-1 to 1)        |
| `gain-k`        | `number`                         | `0`         | Proportional black dot size gain (-1 to 1)         |
| `type`          | `'dots' \| 'ink' \| 'sharp'`     | `'ink'`     | Dot shape style                                    |
| `speed`         | `number`                         | `0`         | Animation speed multiplier (0 freezes)             |
| `frame`         | `number`                         | `0`         | Initial/seek frame for deterministic rendering     |
| `fit`           | `'none' \| 'contain' \| 'cover'` | `'cover'`   | How the graphic fits the canvas                    |
| `scale`         | `number`                         | `1`         | Overall zoom level (0.01 to 4)                     |
| `rotation`      | `number`                         | `0`         | Overall rotation in degrees (0 to 360)             |
| `origin-x`      | `number`                         | `0.5`       | Horizontal origin for world positioning (0 to 1)   |
| `origin-y`      | `number`                         | `0.5`       | Vertical origin for world positioning (0 to 1)     |
| `offset-x`      | `number`                         | `0`         | Horizontal offset of the graphics center (-1 to 1) |
| `offset-y`      | `number`                         | `0`         | Vertical offset of the graphics center (-1 to 1)   |
| `world-width`   | `number`                         | `0`         | Virtual world width before canvas fitting          |
| `world-height`  | `number`                         | `0`         | Virtual world height before canvas fitting         |
| `class`         | `string`                         | —           | Additional CSS classes                             |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
