---
title: Cubes
description: Interactive 3D CSS cube grid that tilts toward cursor with auto-animation.
---

::demo-cubes
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/cubes.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `grid-size` | `number` | `10` | Number of rows and columns |
| `cube-size` | `number` | — | Fixed size in px (default: auto-fill) |
| `max-angle` | `number` | `45` | Maximum tilt angle in degrees |
| `radius` | `number` | `3` | Tilt effect radius in cells |
| `speed` | `number` | `0.02` | Auto-animation speed |
| `border-style` | `string` | `'1px solid #fff'` | Cube face border CSS |
| `face-color` | `string` | `'#060010'` | Cube face background color |
| `auto-animate` | `boolean` | `true` | Enable idle auto-animation |
