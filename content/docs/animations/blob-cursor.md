---
title: Blob Cursor
description: Gooey blob cursor trail with SVG filter and configurable appearance.
---

::demo-blob-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/blob-cursor.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `blob-type` | `'circle' \| 'square'` | `'circle'` | Shape of the blobs |
| `fill-color` | `string` | `'#5227FF'` | Blob fill color |
| `trail-count` | `number` | `3` | Number of trailing blobs |
| `sizes` | `number[]` | `[60, 125, 75]` | Size of each blob |
| `inner-sizes` | `number[]` | `[20, 35, 25]` | Size of inner dots |
| `inner-color` | `string` | `'rgba(255,255,255,0.8)'` | Inner dot color |
| `opacities` | `number[]` | `[0.6, 0.6, 0.6]` | Opacity per blob |
| `shadow-color` | `string` | `'rgba(0,0,0,0.75)'` | Shadow color |
| `shadow-blur` | `number` | `5` | Shadow blur radius |
| `filter-std-deviation` | `number` | `30` | SVG filter blur amount |
| `use-filter` | `boolean` | `true` | Enable gooey SVG filter |
| `fast-lerp` | `number` | `0.3` | Lead blob follow speed |
| `slow-lerp` | `number` | `0.08` | Trail blob follow speed |
