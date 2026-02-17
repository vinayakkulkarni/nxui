---
title: Aurora
description: WebGL aurora borealis effect with simplex noise and configurable color stops.
---

::demo-aurora
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/aurora.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color-stops` | `string[]` | `['#5227FF', '#7cff67', '#5227FF']` | Three hex colors for the aurora gradient |
| `amplitude` | `number` | `1.0` | Vertical amplitude of the aurora wave |
| `blend` | `number` | `0.5` | Blend/softness of the aurora edge |
| `speed` | `number` | `1.0` | Animation speed multiplier |
| `class` | `string` | — | Additional CSS classes |
