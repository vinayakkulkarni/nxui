---
title: Soft Aurora
description: A WebGL aurora borealis background effect with perlin noise, cosine gradient coloring, and mouse interaction.
---

::demo-soft-aurora
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/soft-aurora.json"
```

## Props

| Prop                       | Type      | Default     | Description                       |
| -------------------------- | --------- | ----------- | --------------------------------- |
| `speed`                    | `number`  | `0.6`       | Animation speed multiplier        |
| `scale`                    | `number`  | `1.5`       | Noise scale / zoom level          |
| `brightness`               | `number`  | `1.0`       | Overall brightness multiplier     |
| `color1`                   | `string`  | `'#f7f7f7'` | Primary aurora color (hex)        |
| `color2`                   | `string`  | `'#e100ff'` | Secondary aurora color (hex)      |
| `noise-frequency`          | `number`  | `2.5`       | Perlin noise frequency            |
| `noise-amplitude`          | `number`  | `1.0`       | Perlin noise amplitude            |
| `band-height`              | `number`  | `0.5`       | Vertical band center position     |
| `band-spread`              | `number`  | `1.0`       | Band spread / falloff             |
| `octave-decay`             | `number`  | `0.1`       | Noise octave amplitude decay      |
| `layer-offset`             | `number`  | `0`         | Time offset between aurora layers |
| `color-speed`              | `number`  | `1.0`       | Color cycling speed               |
| `enable-mouse-interaction` | `boolean` | `true`      | Enable cursor tracking            |
| `mouse-influence`          | `number`  | `0.25`      | Mouse influence strength          |
