---
title: Lanyard
description: Three.js lanyard with Verlet integration rope physics, draggable badge card, and optional GLTF model.
---

::demo-lanyard
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/lanyard.json"
```

## Props

| Prop                  | Type                       | Default      | Description                   |
| --------------------- | -------------------------- | ------------ | ----------------------------- |
| `card-model-url`      | `string`                   | `''`         | GLTF model URL for badge card |
| `lanyard-texture-url` | `string`                   | `''`         | Texture URL for lanyard band  |
| `position`            | `[number, number, number]` | `[0, 0, 30]` | Camera position               |
| `gravity`             | `number`                   | `-40`        | Gravity force                 |
| `fov`                 | `number`                   | `20`         | Camera field of view          |
| `transparent`         | `boolean`                  | `true`       | Transparent background        |
| `segment-count`       | `number`                   | `4`          | Number of rope segments       |
| `segment-length`      | `number`                   | `1`          | Length of each segment        |
| `damping`             | `number`                   | `4`          | Velocity damping              |
| `max-speed`           | `number`                   | `50`         | Max velocity                  |
| `band-color`          | `string`                   | `'#ffffff'`  | Lanyard band color            |
| `band-width`          | `number`                   | `0.15`       | Band width                    |
