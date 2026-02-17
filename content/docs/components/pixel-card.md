---
title: Pixel Card
description: Canvas pixel shimmer card with hover-activated sparkle effect and preset variants.
---

::demo-pixel-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-card.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'blue' \| 'yellow' \| 'pink'` | `'default'` | Preset color variant |
| `gap` | `number` | per variant | Pixel spacing |
| `speed` | `number` | per variant | Shimmer speed (0–100) |
| `colors` | `string` | per variant | Comma-separated hex colors |
| `no-focus` | `boolean` | per variant | Disable focus trigger |
