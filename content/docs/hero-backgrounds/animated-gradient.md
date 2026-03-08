---
title: Animated Gradient
description: A beautiful, animated, and customizable WebGL gradient with noise capabilities. Supports built-in presets (Aurora, Oceanic, Amber, Toxic, Ghost) and fully custom configurations.
---

::demo-animated-gradient
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/animated-gradient.json"
```

## Props

| Prop     | Type             | Default                | Description                                                  |
| -------- | ---------------- | ---------------------- | ------------------------------------------------------------ |
| `config` | `GradientConfig` | `{ preset: 'Aurora' }` | Preset name or custom configuration for the gradient pattern |
| `noise`  | `NoiseConfig`    | —                      | Options to apply a noise overlay                             |
| `radius` | `string`         | `'0px'`                | Border radius applied to the container                       |
| `class`  | `string`         | —                      | Additional CSS classes for styling                           |

### GradientConfig (Preset)

| Prop     | Type         | Default | Description                                                      |
| -------- | ------------ | ------- | ---------------------------------------------------------------- |
| `preset` | `PresetName` | —       | `'Aurora'` \| `'Oceanic'` \| `'Amber'` \| `'Toxic'` \| `'Ghost'` |
| `speed`  | `number`     | —       | Override the preset speed                                        |

### GradientConfig (Custom)

| Prop               | Type           | Default    | Description                                          |
| ------------------ | -------------- | ---------- | ---------------------------------------------------- |
| `preset`           | `'custom'`     | —          | Must be `'custom'` for custom configs                |
| `color1`           | `string`       | —          | Primary base color (hex, rgb, hsl)                   |
| `color2`           | `string`       | —          | Secondary color                                      |
| `color3`           | `string`       | —          | Accent color                                         |
| `rotation`         | `number`       | `0`        | Gradient rotation in degrees                         |
| `proportion`       | `number`       | `35`       | Color proportion balance (0–100)                     |
| `scale`            | `number`       | `1`        | Noise scale factor                                   |
| `speed`            | `number`       | `25`       | Animation speed                                      |
| `distortion`       | `number`       | `12`       | Flow distortion intensity                            |
| `swirl`            | `number`       | `80`       | Swirl effect intensity (0–100)                       |
| `swirl-iterations` | `number`       | `10`       | Number of swirl iterations (1–30)                    |
| `softness`         | `number`       | `100`      | Color blending softness (0–100)                      |
| `offset`           | `number`       | `0`        | Time offset for animation start                      |
| `shape`            | `PatternShape` | `'Checks'` | Pattern shape: `'Checks'` \| `'Stripes'` \| `'Edge'` |
| `shape-size`       | `number`       | `10`       | Pattern shape scale (0–100)                          |

### NoiseConfig

| Prop      | Type     | Default | Description                    |
| --------- | -------- | ------- | ------------------------------ |
| `opacity` | `number` | —       | Noise overlay opacity (0–1)    |
| `scale`   | `number` | `1`     | Noise texture scale multiplier |
