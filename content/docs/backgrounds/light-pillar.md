---
title: Light Pillar
description: 3D raymarched light pillar with configurable colors, quality settings, and optional mouse interaction.
---

::demo-light-pillar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/light-pillar.json"
```

## Props

| Prop              | Type                          | Default     | Description                        |
| ----------------- | ----------------------------- | ----------- | ---------------------------------- |
| `top-color`       | `string`                      | `'#5227FF'` | Top gradient color (hex).          |
| `bottom-color`    | `string`                      | `'#FF9FFC'` | Bottom gradient color (hex).       |
| `intensity`       | `number`                      | `1.0`       | Light brightness.                  |
| `rotation-speed`  | `number`                      | `0.3`       | Rotation animation speed.          |
| `interactive`     | `boolean`                     | `false`     | Enable mouse interaction.          |
| `glow-amount`     | `number`                      | `0.005`     | Glow bloom intensity.              |
| `pillar-width`    | `number`                      | `3.0`       | Width of the light pillar.         |
| `pillar-height`   | `number`                      | `0.4`       | Height stretch factor.             |
| `noise-intensity` | `number`                      | `0.5`       | Dither noise amount.               |
| `pillar-rotation` | `number`                      | `0`         | Static rotation offset in degrees. |
| `quality`         | `'low' \| 'medium' \| 'high'` | `'high'`    | Rendering quality preset.          |
