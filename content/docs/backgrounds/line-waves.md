---
title: Line Waves
description: A WebGL animated line wave background with warping, color cycling, and mouse interaction.
---

::demo-line-waves
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/line-waves.json"
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `speed` | `number` | `0.3` | Animation speed multiplier |
| `inner-line-count` | `number` | `32` | Number of inner lines |
| `outer-line-count` | `number` | `36` | Number of outer lines |
| `warp-intensity` | `number` | `1.0` | Warp displacement intensity |
| `rotation` | `number` | `-45` | Rotation angle in degrees |
| `edge-fade-width` | `number` | `0.0` | Edge fade distance |
| `color-cycle-speed` | `number` | `1.0` | Color cycling speed |
| `brightness` | `number` | `0.2` | Overall brightness |
| `color1` | `string` | `'#ffffff'` | First color channel (hex) |
| `color2` | `string` | `'#ffffff'` | Second color channel (hex) |
| `color3` | `string` | `'#ffffff'` | Third color channel (hex) |
| `enable-mouse-interaction` | `boolean` | `true` | Enable cursor tracking |
| `mouse-influence` | `number` | `2.0` | Mouse influence strength |
