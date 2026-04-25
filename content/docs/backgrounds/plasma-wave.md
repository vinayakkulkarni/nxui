---
title: PlasmaWave
description: Raymarched plasma waves with dual-wave interference and OGL.
---

::demo-plasma-wave
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/plasma-wave.json"
```

## Props

| Prop           | Type       | Default                  | Description                                   |
| -------------- | ---------- | ------------------------ | --------------------------------------------- |
| `x-offset`     | `number`   | `0`                      | Horizontal offset of the wave.                |
| `y-offset`     | `number`   | `0`                      | Vertical offset of the wave.                  |
| `rotation-deg` | `number`   | `0`                      | Rotation in degrees.                          |
| `focal-length` | `number`   | `0.8`                    | Focal length for raymarching perspective.     |
| `speed-1`      | `number`   | `0.05`                   | Speed of the first wave.                      |
| `speed-2`      | `number`   | `0.05`                   | Speed of the second wave.                     |
| `dir-2`        | `number`   | `1.0`                    | Direction multiplier for the second wave.     |
| `bend-1`       | `number`   | `1`                      | Bending factor for the first wave.            |
| `bend-2`       | `number`   | `0.5`                    | Bending factor for the second wave.           |
| `colors`       | `string[]` | `['#A855F7', '#06B6D4']` | Two color hex values for the plasma gradient. |
