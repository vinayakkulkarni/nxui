---
title: Splash Cursor
description: Full WebGL fluid simulation cursor effect with realistic ink-in-water dynamics.
---

::demo-splash-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/splash-cursor.json"
```

## Props

| Prop                   | Type      | Default | Description                     |
| ---------------------- | --------- | ------- | ------------------------------- |
| `sim-resolution`       | `number`  | `128`   | Simulation grid resolution      |
| `dye-resolution`       | `number`  | `1440`  | Dye texture resolution          |
| `density-dissipation`  | `number`  | `3.5`   | How fast colors fade            |
| `velocity-dissipation` | `number`  | `2`     | How fast velocity decays        |
| `pressure`             | `number`  | `0.1`   | Pressure force                  |
| `pressure-iterations`  | `number`  | `20`    | Pressure solve iterations       |
| `curl`                 | `number`  | `3`     | Vorticity confinement strength  |
| `splat-radius`         | `number`  | `0.2`   | Radius of color splats          |
| `splat-force`          | `number`  | `6000`  | Force of mouse interaction      |
| `shading`              | `boolean` | `true`  | Enable light/shadow on fluid    |
| `color-update-speed`   | `number`  | `10`    | Speed of color cycling          |
| `transparent`          | `boolean` | `false` | Transparent background          |
