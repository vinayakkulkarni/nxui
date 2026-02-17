---
title: Prismatic Burst
description: WebGL 2 raymarched spectral burst with configurable colors, distortion, and 3D animation modes.
---

::demo-prismatic-burst
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/prismatic-burst.json"
```

## Props

| Prop             | Type                                | Default          | Description                                             |
| ---------------- | ----------------------------------- | ---------------- | ------------------------------------------------------- |
| `intensity`      | `number`                            | `2`              | Overall brightness multiplier.                          |
| `speed`          | `number`                            | `0.5`            | Animation speed.                                        |
| `animation-type` | `'rotate' \| 'rotate3d' \| 'hover'` | `'rotate3d'`     | Animation mode.                                         |
| `colors`         | `string[]`                          | `undefined`      | Custom hex color palette. Default uses spectral colors. |
| `distort`        | `number`                            | `0`              | Ray bending distortion amount.                          |
| `offset`         | `{ x: number; y: number }`          | `{ x: 0, y: 0 }` | Center offset in pixels.                                |
| `ray-count`      | `number`                            | `0`              | Number of directional ray beams (0 = off).              |
| `mix-blend-mode` | `string`                            | `'lighten'`      | CSS mix-blend-mode for the canvas.                      |
