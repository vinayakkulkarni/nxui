---
title: Floating Lines
description: Multi-layered glowing wave lines with cursor-reactive bending and gradient coloring.
---

::demo-floating-lines
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/floating-lines.json"
```

## Props

| Prop              | Type       | Default                  | Description                          |
| ----------------- | ---------- | ------------------------ | ------------------------------------ |
| `lines-gradient`  | `string[]` | `['#e233f5', '#2f4ba2']` | Gradient color stops (hex).          |
| `animation-speed` | `number`   | `1`                      | Speed multiplier for wave animation. |
| `interactive`     | `boolean`  | `true`                   | Enable cursor-reactive bending.      |
| `bend-radius`     | `number`   | `5.0`                    | Radius of the cursor bend effect.    |
| `bend-strength`   | `number`   | `-0.5`                   | Strength of the cursor bend.         |
