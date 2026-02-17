---
title: Gradient Blinds
description: Animated gradient blinds with spotlight, mouse tracking, and up to 8 color stops.
---

::demo-gradient-blinds
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gradient-blinds.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gradient-colors` | `string[]` | `['#FF9FFC', '#5227FF']` | Array of hex color stops (up to 8). |
| `angle` | `number` | `0` | Rotation angle in degrees. |
| `noise` | `number` | `0.3` | Noise grain amount. |
| `blind-count` | `number` | `16` | Number of vertical blinds. |
| `spotlight-radius` | `number` | `0.5` | Spotlight radius around cursor. |
| `spotlight-softness` | `number` | `1` | Spotlight edge softness. |
| `spotlight-opacity` | `number` | `1` | Spotlight brightness. |
| `mirror-gradient` | `boolean` | `false` | Mirror the gradient pattern. |
| `distort-amount` | `number` | `0` | Wave distortion amount. |
| `shine-direction` | `'left' \| 'right'` | `'left'` | Direction of the shine stripe. |
| `mouse-dampening` | `number` | `0.15` | Mouse tracking smoothness. |
