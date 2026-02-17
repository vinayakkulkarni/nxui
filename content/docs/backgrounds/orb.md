---
title: Orb
description: Glowing orb with hue-shifted noise, hover distortion, and optional rotation.
---

::demo-orb
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/orb.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hue` | `number` | `0` | Hue rotation in degrees. |
| `hover-intensity` | `number` | `0.2` | Strength of the hover distortion effect. |
| `rotate-on-hover` | `boolean` | `true` | Rotate the orb when hovered. |
| `force-hover-state` | `boolean` | `false` | Always apply hover effect. |
| `background-color` | `string` | `'#000000'` | Background color (hex). |
