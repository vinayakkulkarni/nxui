---
title: Hyperspeed
description: Three.js highway light simulation with bloom, SMAA, distortion presets, and configurable car lights.
---

::demo-hyperspeed
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/hyperspeed.json"
```

## Props

Hyperspeed accepts an `options` object prop with the following fields:

| Option                  | Type       | Default              | Description                     |
| ----------------------- | ---------- | -------------------- | ------------------------------- |
| `distortion`            | `string`   | `'turbulentDistortion'` | Distortion preset name       |
| `length`                | `number`   | `400`                | Road length                     |
| `road-width`            | `number`   | `10`                 | Road width                      |
| `lanes-per-road`        | `number`   | `4`                  | Number of lanes                 |
| `fov`                   | `number`   | `90`                 | Camera field of view            |
| `speed-up`              | `number`   | `2`                  | Speed multiplier on interaction |
| `car-lights-fade`       | `number`   | `0.4`                | Car lights fade amount          |
| `total-side-light-sticks` | `number` | `20`                 | Side marker count               |
| `colors`                | `object`   | Built-in             | Color configuration             |
