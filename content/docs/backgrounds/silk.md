---
title: Silk
description: Silky fabric-like shader background with flowing noise patterns and configurable color.
---

::demo-silk
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/silk.json"
```

## Props

| Prop              | Type     | Default     | Description                 |
| ----------------- | -------- | ----------- | --------------------------- |
| `speed`           | `number` | `5`         | Animation speed multiplier. |
| `scale`           | `number` | `1`         | Pattern scale.              |
| `color`           | `string` | `'#7B7481'` | Base color (hex).           |
| `noise-intensity` | `number` | `1.5`       | Grain noise intensity.      |
| `rotation`        | `number` | `0`         | UV rotation in radians.     |
