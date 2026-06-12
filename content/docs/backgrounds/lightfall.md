---
title: Lightfall
description: A WebGL raymarched light-streak background with falling luminous trails, configurable colors, density, and mouse interaction.
---

::demo-lightfall
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/lightfall.json"
```

## Props

| Prop                | Type       | Default                             | Description                                              |
| ------------------- | ---------- | ----------------------------------- | -------------------------------------------------------- |
| `colors`            | `string[]` | `['#A6C8FF', '#5227FF', '#FF9FFC']` | Array of hex color stops for the streak palette (max 8). |
| `background-color`  | `string`   | `'#0A29FF'`                         | Background glow color (hex).                             |
| `speed`             | `number`   | `0.5`                               | Animation speed multiplier.                              |
| `streak-count`      | `number`   | `2`                                 | Number of streaks (1–16).                                |
| `streak-width`      | `number`   | `1`                                 | Width of each streak.                                    |
| `streak-length`     | `number`   | `1`                                 | Length of each streak tail.                              |
| `glow`              | `number`   | `1`                                 | Overall glow intensity.                                  |
| `density`           | `number`   | `0.6`                               | Density of angular rings.                                |
| `twinkle`           | `number`   | `1`                                 | Twinkle intensity of streaks.                            |
| `zoom`              | `number`   | `3`                                 | Raymarched scene zoom.                                   |
| `background-glow`   | `number`   | `0.5`                               | Background center glow intensity.                        |
| `opacity`           | `number`   | `1`                                 | Opacity of the rendered output.                          |
| `mouse-interaction` | `boolean`  | `true`                              | Enable mouse-reactive glow.                              |
| `mouse-strength`    | `number`   | `0.5`                               | Strength of the mouse glow.                              |
| `mouse-radius`      | `number`   | `1`                                 | Radius of the mouse glow.                                |
| `mouse-dampening`   | `number`   | `0.15`                              | Smoothing factor for mouse movement (0 = instant).       |
| `paused`            | `boolean`  | `false`                             | Pause the animation loop.                                |
| `dpr`               | `number`   | `window.devicePixelRatio`           | Device pixel ratio override.                             |
| `class`             | `string`   | `''`                                | Additional Tailwind classes for the container.           |
