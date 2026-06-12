---
title: Ferrofluid
description: A WebGL ferrofluid metaball background with flowing turbulence, configurable colors, rim glow, and mouse interaction.
---

::demo-ferrofluid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ferrofluid.json"
```

## Props

| Prop                | Type       | Default                             | Description                                    |
| ------------------- | ---------- | ----------------------------------- | ---------------------------------------------- |
| `colors`            | `string[]` | `['#ffffff', '#ffffff', '#ffffff']` | Up to 8 hex colors used by the fluid palette.  |
| `speed`             | `number`   | `0.5`                               | Animation speed multiplier.                    |
| `scale`             | `number`   | `1.6`                               | Shader coordinate scale.                       |
| `turbulence`        | `number`   | `1`                                 | Turbulence distortion amount.                  |
| `fluidity`          | `number`   | `0.1`                               | Blend softness between metaballs.              |
| `rim-width`         | `number`   | `0.2`                               | Rim highlight width.                           |
| `sharpness`         | `number`   | `2.5`                               | Rim sharpness exponent.                        |
| `shimmer`           | `number`   | `1.5`                               | Shimmer noise intensity.                       |
| `glow`              | `number`   | `2`                                 | Overall glow multiplier.                       |
| `flow-direction`    | `string`   | `'down'`                            | Flow direction: `up`, `down`, `left`, `right`. |
| `opacity`           | `number`   | `1`                                 | Output opacity.                                |
| `mouse-interaction` | `boolean`  | `true`                              | Enable mouse-driven glow.                      |
| `mouse-strength`    | `number`   | `1`                                 | Mouse glow strength.                           |
| `mouse-radius`      | `number`   | `0.35`                              | Mouse glow radius.                             |
| `mouse-dampening`   | `number`   | `0.15`                              | Mouse follow smoothing.                        |
| `paused`            | `boolean`  | `false`                             | Pause rendering while keeping time updates.    |
| `dpr`               | `number`   | `devicePixelRatio`                  | Device pixel ratio.                            |
| `class`             | `string`   | `''`                                | Additional CSS classes.                        |
