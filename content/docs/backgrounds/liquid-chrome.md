---
title: Liquid Chrome
description: Interactive liquid chrome effect with ripple distortion and mouse tracking.
---

::demo-liquid-chrome
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/liquid-chrome.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `base-color` | `[number, number, number]` | `[0.1, 0.1, 0.1]` | RGB base color (0–1 range) |
| `speed` | `number` | `0.2` | Animation speed multiplier |
| `amplitude` | `number` | `0.3` | Wave distortion amplitude |
| `frequency-x` | `number` | `3` | Horizontal wave frequency |
| `frequency-y` | `number` | `3` | Vertical wave frequency |
| `interactive` | `boolean` | `true` | Enable mouse/touch interaction |
| `class` | `string` | — | Additional CSS classes |
