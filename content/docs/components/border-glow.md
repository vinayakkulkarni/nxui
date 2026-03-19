---
title: Border Glow
description: A CSS-driven directional glow card that tracks cursor position and proximity to edges with configurable colors and gradients.
---

::demo-border-glow
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/border-glow.json"
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `edge-sensitivity` | `number` | `30` | Edge proximity threshold for glow activation |
| `glow-color` | `string` | `'40 80 80'` | HSL values (space-separated H S L) for glow |
| `background-color` | `string` | `'#060010'` | Card background color |
| `border-radius` | `number` | `28` | Card border radius in px |
| `glow-radius` | `number` | `40` | Outer glow spread in px |
| `glow-intensity` | `number` | `1.0` | Glow opacity multiplier |
| `cone-spread` | `number` | `25` | Directional cone spread (%) |
| `animated` | `boolean` | `false` | Auto-play sweep animation on mount |
| `colors` | `string[]` | `['#c084fc', '#f472b6', '#38bdf8']` | Mesh gradient colors |
| `fill-opacity` | `number` | `0.5` | Inner fill glow opacity |
