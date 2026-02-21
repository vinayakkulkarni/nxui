---
title: Antigravity
description: Three.js InstancedMesh particle field with mouse-driven magnetic attraction, wave animation, and configurable shapes.
---

::demo-antigravity
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/antigravity.json"
```

## Props

| Prop             | Type                                              | Default     | Description                     |
| ---------------- | ------------------------------------------------- | ----------- | ------------------------------- |
| `count`          | `number`                                          | `300`       | Number of particles             |
| `magnet-radius`  | `number`                                          | `10`        | Mouse attraction radius         |
| `ring-radius`    | `number`                                          | `10`        | Default ring arrangement radius |
| `wave-speed`     | `number`                                          | `0.4`       | Wave animation speed            |
| `wave-amplitude` | `number`                                          | `1`         | Wave height amplitude           |
| `particle-size`  | `number`                                          | `2`         | Size of each particle           |
| `lerp-speed`     | `number`                                          | `0.1`       | Smoothing speed                 |
| `color`          | `string`                                          | `'#FF9FFC'` | Particle color                  |
| `auto-animate`   | `boolean`                                         | `false`     | Auto-animate without mouse      |
| `particle-shape` | `'capsule' \| 'sphere' \| 'box' \| 'tetrahedron'` | `'capsule'` | Shape of particles              |
| `rotation-speed` | `number`                                          | `0`         | Rotation speed                  |
| `depth-factor`   | `number`                                          | `1`         | Depth spread factor             |
| `pulse-speed`    | `number`                                          | `3`         | Pulse animation speed           |
| `field-strength` | `number`                                          | `1`         | Magnetic field strength         |
