---
title: Ripple Grid
description: Animated sine-wave ripple grid with mouse interaction, rainbow mode, and vignette.
---

::demo-ripple-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ripple-grid.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enable-rainbow` | `boolean` | `false` | Enable rainbow color cycling. |
| `grid-color` | `string` | `'#ffffff'` | Grid line color (hex). |
| `ripple-intensity` | `number` | `0.05` | Ripple wave amplitude. |
| `grid-size` | `number` | `10.0` | Number of grid divisions. |
| `grid-thickness` | `number` | `15.0` | Grid line thickness. |
| `fade-distance` | `number` | `1.5` | Edge fade distance exponent. |
| `vignette-strength` | `number` | `2.0` | Corner darkening strength. |
| `glow-intensity` | `number` | `0.1` | Grid line glow amount. |
| `opacity` | `number` | `1.0` | Overall opacity. |
| `grid-rotation` | `number` | `0` | Grid rotation in degrees. |
| `mouse-interaction` | `boolean` | `true` | Enable mouse ripple interaction. |
| `mouse-interaction-radius` | `number` | `1` | Mouse influence radius. |
