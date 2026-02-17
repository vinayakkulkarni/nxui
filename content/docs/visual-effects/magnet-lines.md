---
title: Magnet Lines
description: Lines that bend toward the cursor like a magnetic field with smooth transitions.
---

::demo-magnet-lines
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magnet-lines.json"
```

## Props

| Prop              | Type     | Default          | Description                              |
| ----------------- | -------- | ---------------- | ---------------------------------------- |
| `line-count`      | `number` | `40`             | Number of vertical lines to render       |
| `line-color`      | `string` | `'currentColor'` | Color of the lines                       |
| `line-width`      | `number` | `1`              | Width of each line in pixels             |
| `magnet-strength` | `number` | `0.5`            | Strength of the magnetic effect (0-1)    |
| `class`           | `string` | —                | Additional CSS classes for the container |
