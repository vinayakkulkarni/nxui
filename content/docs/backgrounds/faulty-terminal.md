---
title: Faulty Terminal
description: Matrix-style hacker terminal with digit patterns, scanlines, and chromatic aberration.
---

::demo-faulty-terminal
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/faulty-terminal.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `scale` | `number` | `1` | Overall scale of the terminal grid. |
| `grid-mul` | `[number, number]` | `[2, 1]` | Grid multiplier for digit density. |
| `digit-size` | `number` | `1.5` | Size of individual digit cells. |
| `scanline-intensity` | `number` | `0.3` | CRT scanline strength. |
| `glitch-amount` | `number` | `1` | Horizontal glitch displacement. |
| `flicker-amount` | `number` | `1` | Flickering intensity. |
| `chromatic-aberration` | `number` | `0` | RGB channel separation. |
| `curvature` | `number` | `0.2` | CRT barrel distortion curvature. |
| `tint` | `string` | `'#ffffff'` | Color tint (hex). |
| `mouse-react` | `boolean` | `true` | Enable mouse interaction. |
| `mouse-strength` | `number` | `0.2` | Mouse influence strength. |
| `brightness` | `number` | `1` | Overall brightness. |
| `speed` | `number` | `0.3` | Animation speed multiplier. |
