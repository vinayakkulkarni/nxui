---
title: Chroma Grid
description: Profile card grid with mouse-tracking spotlight reveal and per-card hover glow.
---

::demo-chroma-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/chroma-grid.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | ChromaGridItem[] | 6 defaults | Array of card items |
| radius | number | 300 | Spotlight radius in pixels |
| columns | number | 3 | Number of grid columns |
| damping | number | 0.12 | Mouse follow smoothness (0–1) |

## ChromaGridItem

| Prop | Type | Description |
|------|------|-------------|
| image | string | Avatar/image URL |
| title | string | Name or title |
| subtitle | string | Role or description |
| handle | string | Social handle |
| borderColor | string | Hover border color |
| gradient | string | Card background gradient CSS |
| url | string | Click-through URL |
