---
title: Pixel Snow
description: 3D voxel-raymarched pixelated snowfall with configurable flake shapes and wind direction.
---

::demo-pixel-snow
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-snow.json"
```

## Props

| Prop               | Type                                 | Default     | Description                  |
| ------------------ | ------------------------------------ | ----------- | ---------------------------- |
| `color`            | `string`                             | `'#ffffff'` | Snowflake color (hex).       |
| `flake-size`       | `number`                             | `0.01`      | Base flake size.             |
| `min-flake-size`   | `number`                             | `1.25`      | Minimum flake size at depth. |
| `pixel-resolution` | `number`                             | `200`       | Pixelation resolution.       |
| `speed`            | `number`                             | `1.25`      | Fall speed multiplier.       |
| `depth-fade`       | `number`                             | `8`         | Depth fog distance.          |
| `far-plane`        | `number`                             | `20`        | Maximum render distance.     |
| `brightness`       | `number`                             | `1`         | Flake brightness.            |
| `gamma`            | `number`                             | `0.4545`    | Gamma correction.            |
| `density`          | `number`                             | `0.3`       | Snowfall density (0-1).      |
| `variant`          | `'square' \| 'round' \| 'snowflake'` | `'square'`  | Flake shape variant.         |
| `direction`        | `number`                             | `125`       | Wind direction in degrees.   |
