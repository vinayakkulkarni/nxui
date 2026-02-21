---
title: Fluid Glass
description: Three.js glass refraction effect with chromatic aberration shader in lens, bar, or cube mode.
---

::demo-fluid-glass
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fluid-glass.json"
```

## Props

| Prop                    | Type                           | Default     | Description                       |
| ----------------------- | ------------------------------ | ----------- | --------------------------------- |
| `mode`                  | `'lens' \| 'bar' \| 'cube'`   | `'lens'`    | Glass shape mode                  |
| `color`                 | `string`                       | `'#ffffff'` | Glass tint color                  |
| `thickness`             | `number`                       | `0.2`       | Glass thickness                   |
| `roughness`             | `number`                       | `0.05`      | Surface roughness                 |
| `chromatic-aberration`  | `number`                       | `0.06`      | Chromatic aberration intensity    |
| `anisotropy`            | `number`                       | `0.1`       | Anisotropy                        |
| `distortion`            | `number`                       | `0.0`       | Distortion amount                 |
| `distortion-scale`      | `number`                       | `0.3`       | Distortion scale                  |
| `temporal-distortion`   | `number`                       | `0.5`       | Time-varying distortion           |
| `ior`                   | `number`                       | `1.5`       | Index of refraction               |
