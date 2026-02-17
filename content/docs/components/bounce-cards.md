---
title: Bounce Cards
description: Fan of image cards with staggered entrance and hover push animation.
---

::demo-bounce-cards
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/bounce-cards.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `string[]` | `[]` | Array of image URLs |
| `container-width` | `number` | `400` | Container width in pixels |
| `container-height` | `number` | `400` | Container height in pixels |
| `animation-delay` | `number` | `500` | Entrance animation delay in ms |
| `animation-stagger` | `number` | `60` | Stagger between each card in ms |
| `transform-styles` | `string[]` | Fanned layout | CSS transform for each card |
| `enable-hover` | `boolean` | `true` | Enable hover push effect |
