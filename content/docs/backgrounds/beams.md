---
title: Beams
description: 3D light beam planes with Perlin noise deformation and directional lighting.
---

::demo-beams
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/beams.json"
```

## Props

| Prop              | Type     | Default     | Description                            |
| ----------------- | -------- | ----------- | -------------------------------------- |
| `beam-width`      | `number` | `2`         | Width of each beam plane.              |
| `beam-height`     | `number` | `15`        | Height of each beam plane.             |
| `beam-number`     | `number` | `12`        | Number of beam planes.                 |
| `light-color`     | `string` | `'#ffffff'` | Color of the directional light (hex).  |
| `speed`           | `number` | `2`         | Animation speed multiplier.            |
| `noise-intensity` | `number` | `1.75`      | Grain noise intensity.                 |
| `scale`           | `number` | `0.2`       | Noise scale.                           |
| `rotation`        | `number` | `0`         | Rotation of the beam group in degrees. |
