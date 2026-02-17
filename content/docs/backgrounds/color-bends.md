---
title: Color Bends
description: Complex warp shader with mouse parallax, auto-rotation, and up to 8 custom colors.
---

::demo-color-bends
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/color-bends.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rotation` | `number` | `45` | Initial rotation in degrees. |
| `speed` | `number` | `0.2` | Animation speed. |
| `colors` | `string[]` | `[]` | Array of hex colors (up to 8). Empty uses default RGB. |
| `transparent` | `boolean` | `true` | Enable transparency. |
| `auto-rotate` | `number` | `0` | Auto-rotation speed in degrees per second. |
| `scale` | `number` | `1` | Zoom scale. |
| `frequency` | `number` | `1` | Pattern frequency. |
| `warp-strength` | `number` | `1` | Warp distortion intensity. |
| `mouse-influence` | `number` | `1` | Mouse interaction strength. |
| `parallax` | `number` | `0.5` | Parallax depth effect. |
| `noise` | `number` | `0.1` | Grain noise amount. |
