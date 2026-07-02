---
title: Pulsing Border
description: Luminous trails of color merging into a glowing gradient contour. Ported from Paper Shaders (Apache-2.0).
---

::demo-paper-pulsing-border
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-pulsing-border.json"
```

## Props

| Prop            | Type                             | Default                               | Description                                                                 |
| --------------- | -------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `color-back`    | `string`                         | `'#000000'`                           | Background color in any CSS color format                                    |
| `colors`        | `string[]`                       | `['#0dc1fd', '#d915ef', '#ff3f2ecc']` | Up to 5 spot colors used in the gradient                                    |
| `roundness`     | `number`                         | `0.25`                                | Border radius (0 to 1)                                                      |
| `thickness`     | `number`                         | `0.1`                                 | Border base width (0 to 1)                                                  |
| `margin`        | `number`                         | —                                     | Sets all four margin values at once; overrides margin-left/right/top/bottom |
| `margin-left`   | `number`                         | `0`                                   | Distance from the left edge to the effect (0 to 1)                          |
| `margin-right`  | `number`                         | `0`                                   | Distance from the right edge to the effect (0 to 1)                         |
| `margin-top`    | `number`                         | `0`                                   | Distance from the top edge to the effect (0 to 1)                           |
| `margin-bottom` | `number`                         | `0`                                   | Distance from the bottom edge to the effect (0 to 1)                        |
| `aspect-ratio`  | `'auto' \| 'square'`             | `'auto'`                              | Aspect ratio mode                                                           |
| `softness`      | `number`                         | `0.75`                                | Border edge sharpness, 0 = hard edge, 1 = smooth gradient (0 to 1)          |
| `intensity`     | `number`                         | `0.2`                                 | Thickness of individual color spots (0 to 1)                                |
| `bloom`         | `number`                         | `0.25`                                | Power of glow, 0 = normal blending, 1 = additive blending (0 to 1)          |
| `spots`         | `number`                         | `5`                                   | Number of spots added for each color (1 to 20)                              |
| `spot-size`     | `number`                         | `0.5`                                 | Angular size of spots (0 to 1)                                              |
| `pulse`         | `number`                         | `0.25`                                | Optional pulsing animation intensity (0 to 1)                               |
| `smoke`         | `number`                         | `0.3`                                 | Optional noisy shape extending the border (0 to 1)                          |
| `smoke-size`    | `number`                         | `0.6`                                 | Size of the smoke effect (0 to 1)                                           |
| `speed`         | `number`                         | `1`                                   | Animation speed multiplier (0 freezes)                                      |
| `frame`         | `number`                         | `0`                                   | Initial/seek frame for deterministic rendering                              |
| `fit`           | `'none' \| 'contain' \| 'cover'` | `'contain'`                           | How the graphic fits the canvas                                             |
| `scale`         | `number`                         | `0.6`                                 | Overall zoom level (0.01 to 4)                                              |
| `rotation`      | `number`                         | `0`                                   | Overall rotation in degrees (0 to 360)                                      |
| `origin-x`      | `number`                         | `0.5`                                 | Horizontal origin for world positioning (0 to 1)                            |
| `origin-y`      | `number`                         | `0.5`                                 | Vertical origin for world positioning (0 to 1)                              |
| `offset-x`      | `number`                         | `0`                                   | Horizontal offset of the graphics center (-1 to 1)                          |
| `offset-y`      | `number`                         | `0`                                   | Vertical offset of the graphics center (-1 to 1)                            |
| `world-width`   | `number`                         | `0`                                   | Virtual world width before canvas fitting                                   |
| `world-height`  | `number`                         | `0`                                   | Virtual world height before canvas fitting                                  |
| `class`         | `string`                         | —                                     | Additional CSS classes                                                      |

## Attribution

Powered by [Paper Shaders](https://github.com/paper-design/shaders)
(© Lost Coast Labs, Inc., Apache-2.0) via the framework-agnostic
`@paper-design/shaders` package driven by a Vue 3 mount.
