---
title: Lightning
description: WebGL-powered lightning bolt effect with fbm noise and customizable hue.
---

::demo-lightning
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/lightning.json"
```

## Props

| Prop        | Type     | Default | Description                        |
| ----------- | -------- | ------- | ---------------------------------- |
| `hue`       | `number` | `230`   | Hue of the lightning color (0–360) |
| `x-offset`  | `number` | `0`     | Horizontal offset of the bolt      |
| `speed`     | `number` | `1`     | Animation speed multiplier         |
| `intensity` | `number` | `1`     | Brightness intensity               |
| `size`      | `number` | `1`     | Scale of the noise pattern         |
| `class`     | `string` | —       | Additional CSS classes             |
