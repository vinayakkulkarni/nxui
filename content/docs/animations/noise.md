---
title: Noise
description: An animated canvas noise grain overlay for adding texture to backgrounds and sections.
---

::demo-noise
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/noise.json"
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `pattern-size` | `number` | `250` | Pattern size (reserved for future use) |
| `pattern-scale-x` | `number` | `1` | Pattern horizontal scale (reserved) |
| `pattern-scale-y` | `number` | `1` | Pattern vertical scale (reserved) |
| `pattern-refresh-interval` | `number` | `2` | Redraw every N frames (higher = less CPU) |
| `pattern-alpha` | `number` | `15` | Noise pixel alpha (0–255, lower = subtler) |
