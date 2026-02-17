---
title: Pixel Canvas
description: An interactive pixel grid canvas that responds to mouse movement with customizable colors.
---

::demo-pixel-canvas
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-canvas.json"
```

## Props

| Prop         | Type       | Default                                                   | Description                              |
| ------------ | ---------- | --------------------------------------------------------- | ---------------------------------------- |
| `pixel-size` | `number`   | `20`                                                      | Size of each pixel in pixels             |
| `colors`     | `string[]` | `['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7']` | Array of colors to randomly select from  |
| `fade-speed` | `number`   | `0.02`                                                    | Speed at which pixels fade out (0-1)     |
| `class`      | `string`   | —                                                         | Additional CSS classes for the container |
