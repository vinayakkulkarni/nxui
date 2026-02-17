---
title: Dark Veil
description: CPPN neural network shader background with hue shift, scanlines, and warp distortion.
---

::demo-dark-veil
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dark-veil.json"
```

## Props

| Prop                 | Type     | Default | Description                    |
| -------------------- | -------- | ------- | ------------------------------ |
| `hue-shift`          | `number` | `0`     | Hue rotation in degrees.       |
| `noise-intensity`    | `number` | `0`     | Grain noise overlay intensity. |
| `scanline-intensity` | `number` | `0`     | CRT-style scanline intensity.  |
| `speed`              | `number` | `0.5`   | Animation speed multiplier.    |
| `scanline-frequency` | `number` | `0`     | Scanline frequency.            |
| `warp-amount`        | `number` | `0`     | UV warp distortion amount.     |
