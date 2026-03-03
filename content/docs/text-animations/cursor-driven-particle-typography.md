---
title: Cursor Driven Particle Typography
description: Canvas-based text rendered as particles that disperse on cursor hover with spring physics.
---

::demo-cursor-driven-particle-typography
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/cursor-driven-particle-typography.json"
```

## Props

| Prop                  | Type     | Default                | Description                                           |
| --------------------- | -------- | ---------------------- | ----------------------------------------------------- |
| `text`                | `string` | —                      | The text to render as particles                       |
| `font-size`           | `number` | `120`                  | Font size in pixels                                   |
| `font-family`         | `string` | `'Inter, sans-serif'`  | Font family                                           |
| `particle-size`       | `number` | `1.5`                  | Size of each particle                                 |
| `particle-density`    | `number` | `6`                    | Density of particles (lower = more, minimum 1)        |
| `dispersion-strength` | `number` | `15`                   | How strongly the cursor pushes particles away         |
| `return-speed`        | `number` | `0.08`                 | Speed at which particles return to origin             |
| `color`               | `string` | —                      | Custom particle color (overrides inherited text color) |
| `class`               | `string` | —                      | Additional CSS classes                                |
