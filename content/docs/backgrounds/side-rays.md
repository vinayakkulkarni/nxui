---
title: Side Rays
description: A WebGL light-rays background emanating from a screen corner, with configurable origin, tilt, colors, spread, and falloff.
---

::demo-side-rays
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/side-rays.json"
```

## Props

| Prop         | Type     | Default       | Description                                                                           |
| ------------ | -------- | ------------- | ------------------------------------------------------------------------------------- |
| `speed`      | `number` | `2.5`         | Animation speed multiplier.                                                           |
| `ray-color1` | `string` | `'#EAB308'`   | First ray color (hex).                                                                |
| `ray-color2` | `string` | `'#96c8ff'`   | Second ray color (hex).                                                               |
| `intensity`  | `number` | `2`           | Overall brightness multiplier.                                                        |
| `spread`     | `number` | `2`           | How wide the ray fan spreads.                                                         |
| `origin`     | `string` | `'top-right'` | Corner the rays emanate from: `top-left`, `top-right`, `bottom-left`, `bottom-right`. |
| `tilt`       | `number` | `0`           | Tilt angle of the ray fan in degrees.                                                 |
| `saturation` | `number` | `1.5`         | Color saturation (0 = grayscale).                                                     |
| `blend`      | `number` | `0.75`        | Blend factor between the two ray colors.                                              |
| `falloff`    | `number` | `1.6`         | Distance falloff exponent.                                                            |
| `opacity`    | `number` | `1.0`         | Overall opacity of the effect.                                                        |
| `class`      | `string` | `''`          | Additional Tailwind classes for the container.                                        |
