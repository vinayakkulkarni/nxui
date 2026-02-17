---
title: Light Rays
description: Animated light rays emanating from a configurable origin with mouse following and color controls.
---

::demo-light-rays
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/light-rays.json"
```

## Props

| Prop              | Type      | Default        | Description                                                                                              |
| ----------------- | --------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `rays-origin`     | `string`  | `'top-center'` | Origin position: top-center, top-left, top-right, left, right, bottom-left, bottom-center, bottom-right. |
| `rays-color`      | `string`  | `'#ffffff'`    | Color of the light rays (hex).                                                                           |
| `rays-speed`      | `number`  | `1`            | Animation speed multiplier.                                                                              |
| `light-spread`    | `number`  | `1`            | How wide the rays spread.                                                                                |
| `ray-length`      | `number`  | `2`            | Maximum ray length multiplier.                                                                           |
| `pulsating`       | `boolean` | `false`        | Enable pulsating intensity.                                                                              |
| `fade-distance`   | `number`  | `1.0`          | Distance at which rays fade.                                                                             |
| `saturation`      | `number`  | `1.0`          | Color saturation (0 = grayscale).                                                                        |
| `follow-mouse`    | `boolean` | `true`         | Rays follow mouse position.                                                                              |
| `mouse-influence` | `number`  | `0.1`          | How much mouse affects ray direction.                                                                    |
| `noise-amount`    | `number`  | `0.0`          | Amount of noise grain.                                                                                   |
| `distortion`      | `number`  | `0.0`          | Ray edge distortion amount.                                                                              |
