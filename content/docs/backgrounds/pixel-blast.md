---
title: Pixel Blast
description: Dithered pixel pattern with Bayer matrix, FBM noise, click ripples, and configurable shapes.
---

::demo-pixel-blast
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-blast.json"
```

## Props

| Prop                     | Type                                              | Default     | Description                 |
| ------------------------ | ------------------------------------------------- | ----------- | --------------------------- |
| `variant`                | `'square' \| 'circle' \| 'triangle' \| 'diamond'` | `'square'`  | Pixel shape variant.        |
| `pixel-size`             | `number`                                          | `3`         | Size of each pixel element. |
| `color`                  | `string`                                          | `'#B19EEF'` | Pattern color (hex).        |
| `pattern-scale`          | `number`                                          | `2`         | FBM noise scale.            |
| `pattern-density`        | `number`                                          | `1`         | Pattern fill density.       |
| `pixel-size-jitter`      | `number`                                          | `0`         | Random size variation.      |
| `enable-ripples`         | `boolean`                                         | `true`      | Enable click ripple effect. |
| `ripple-intensity-scale` | `number`                                          | `1`         | Ripple wave strength.       |
| `ripple-thickness`       | `number`                                          | `0.1`       | Ripple ring thickness.      |
| `ripple-speed`           | `number`                                          | `0.3`       | Ripple expansion speed.     |
| `speed`                  | `number`                                          | `0.5`       | Animation speed multiplier. |
| `edge-fade`              | `number`                                          | `0.5`       | Edge vignette distance.     |
