---
title: Iridescence
description: Mesmerizing iridescent color waves with mouse-reactive distortion.
---

::demo-iridescence
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/iridescence.json"
```

## Props

| Prop          | Type                       | Default     | Description                      |
| ------------- | -------------------------- | ----------- | -------------------------------- |
| `color`       | `[number, number, number]` | `[1, 1, 1]` | RGB color multiplier (0–1 range) |
| `speed`       | `number`                   | `1.0`       | Animation speed multiplier       |
| `amplitude`   | `number`                   | `0.1`       | Mouse influence amplitude        |
| `mouse-react` | `boolean`                  | `true`      | Enable mouse interaction         |
| `class`       | `string`                   | —           | Additional CSS classes           |
