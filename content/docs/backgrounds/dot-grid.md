---
title: Dot Grid
description: Interactive canvas dot grid with velocity-based impulse, click shockwaves, and elastic return.
---

::demo-dot-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dot-grid.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dot-size` | `number` | `16` | Diameter of each dot |
| `gap` | `number` | `32` | Spacing between dots |
| `base-color` | `string` | `'#5227FF'` | Default dot color |
| `active-color` | `string` | `'#5227FF'` | Color when cursor is near |
| `proximity` | `number` | `150` | Cursor proximity radius for color change |
| `speed-trigger` | `number` | `100` | Minimum cursor speed to push dots |
| `shock-radius` | `number` | `250` | Click shockwave radius |
| `shock-strength` | `number` | `5` | Click push strength |
| `max-speed` | `number` | `5000` | Maximum cursor speed cap |
| `return-duration` | `number` | `1.5` | Elastic return duration in seconds |
