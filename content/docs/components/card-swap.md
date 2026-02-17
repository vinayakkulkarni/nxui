---
title: Card Swap
description: Stacked card carousel that cycles the front card to the back with 3D transforms.
---

::demo-card-swap
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/card-swap.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| card-distance | number | 60 | Horizontal offset between stacked cards |
| vertical-distance | number | 70 | Vertical offset between stacked cards |
| delay | number | 5000 | Auto-swap interval in ms |
| pause-on-hover | boolean | false | Pause cycling on hover |
| skew-amount | number | 6 | Skew angle in degrees |
