---
title: Gooey Nav
description: Particle-burst navigation with SVG gooey filter effect and spring animation.
---

::demo-gooey-nav
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gooey-nav.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `GooeyNavItem[]` | — | Navigation items (required) |
| `animation-time` | `number` | `600` | Base animation duration in ms |
| `particle-count` | `number` | `15` | Number of gooey particles |
| `particle-distances` | `[number, number]` | `[90, 10]` | Start and end particle distances |
| `particle-r` | `number` | `100` | Particle rotation range |
| `time-variance` | `number` | `300` | Animation time randomness |
| `colors` | `number[]` | `[1,2,3,1,2,3,1,4]` | Color indices for particles (maps to `--color-N` CSS vars) |
| `initial-active-index` | `number` | `0` | Initially active item |

### GooeyNavItem

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Display text |
| `href` | `string` | Optional link URL |
