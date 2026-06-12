---
title: Strands
description: Animated flowing light strands rendered with OGL shaders, with configurable colors, waviness, glow, and optional glass refraction.
---

::demo-strands
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/strands.json"
```

## Props

| Prop         | Type       | Default                                        | Description                                         |
| ------------ | ---------- | ---------------------------------------------- | --------------------------------------------------- |
| `colors`     | `string[]` | `['#FF4242', '#7C3AED', '#06B6D4', '#EAB308']` | Array of strand colors used for the looping palette |
| `count`      | `number`   | `3`                                            | Number of simultaneous strands (max 12)             |
| `speed`      | `number`   | `0.5`                                          | Animation speed multiplier                          |
| `amplitude`  | `number`   | `1`                                            | Height of the strand waves                          |
| `waviness`   | `number`   | `1`                                            | Frequency of the strand waves                       |
| `thickness`  | `number`   | `0.7`                                          | Strand thickness multiplier                         |
| `glow`       | `number`   | `2.6`                                          | Glow/bloom intensity                                |
| `taper`      | `number`   | `3`                                            | Edge taper exponent                                 |
| `spread`     | `number`   | `1`                                            | Phase spread between strands                        |
| `hue-shift`  | `number`   | `0`                                            | Global hue shift offset                             |
| `intensity`  | `number`   | `0.6`                                          | Overall brightness intensity                        |
| `saturation` | `number`   | `1.5`                                          | Color saturation multiplier                         |
| `opacity`    | `number`   | `1`                                            | Global opacity multiplier                           |
| `scale`      | `number`   | `1.5`                                          | UV scale/zoom of the strands                        |
| `glass`      | `boolean`  | `false`                                        | Render a refractive glass overlay                   |
| `refraction` | `number`   | `1`                                            | Glass refraction strength                           |
| `dispersion` | `number`   | `1`                                            | Chromatic dispersion strength of the glass          |
| `glass-size` | `number`   | `1`                                            | Size multiplier of the glass overlay                |
| `class`      | `string`   | `''`                                           | Additional Tailwind classes for the container       |
