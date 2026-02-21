---
title: Metallic Paint
description: Raw WebGL2 metallic paint effect with Laplacian depth solve, chromatic aberration, and mouse-driven ripples.
---

::demo-metallic-paint
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/metallic-paint.json"
```

## Props

| Prop               | Type      | Default | Description                 |
| ------------------ | --------- | ------- | --------------------------- |
| `image-src`        | `string`  | —       | Image URL (required)        |
| `seed`             | `number`  | `42`    | Noise seed                  |
| `scale`            | `number`  | `4`     | Pattern scale               |
| `refraction`       | `number`  | `0.01`  | Refraction amount           |
| `blur`             | `number`  | `0.015` | Blur intensity              |
| `liquid`           | `number`  | `0.75`  | Liquid effect strength      |
| `speed`            | `number`  | `0.3`   | Animation speed             |
| `brightness`       | `number`  | `2`     | Brightness multiplier       |
| `contrast`         | `number`  | `0.5`   | Contrast                    |
| `mouse-animation`  | `boolean` | `false` | Enable mouse-driven ripples |
| `chromatic-spread` | `number`  | —       | Chromatic aberration spread |
| `tint-color`       | `string`  | —       | Color tint override         |
