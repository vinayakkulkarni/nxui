---
title: Hero Geometric
description: A dithered geometric gradient hero section powered by Three.js shaders with simplex noise and Bayer dithering.
---

::demo-hero-geometric
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/hero-geometric.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title1` | `string` | — | First line of the headline |
| `title2` | `string` | — | Second line of the headline |
| `description` | `string` | — | Supporting text below the headline |
| `color1` | `string` | `'#3B82F6'` | Primary gradient color (deep tone) |
| `color2` | `string` | `'#F0F9FF'` | Secondary gradient color (pale tone) |
| `speed` | `number` | `1` | Animation speed multiplier |
| `class` | `string` | `''` | Additional CSS classes |
