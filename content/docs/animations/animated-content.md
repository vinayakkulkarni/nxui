---
title: Animated Content
description: Scroll-triggered entrance animation with configurable direction, distance, and easing.
---

::demo-animated-content
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/animated-content.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `distance` | `number` | `100` | Travel distance in pixels |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Animation axis |
| `reverse` | `boolean` | `false` | Reverse the direction |
| `duration` | `number` | `0.8` | Animation duration in seconds |
| `ease` | `string` | `'cubic-bezier(...)'` | CSS easing function |
| `initial-opacity` | `number` | `0` | Starting opacity |
| `animate-opacity` | `boolean` | `true` | Whether to animate opacity |
| `scale` | `number` | `1` | Starting scale |
| `threshold` | `number` | `0.1` | Intersection observer threshold |
| `delay` | `number` | `0` | Delay before animation in seconds |
