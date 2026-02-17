---
title: Liquid Ether
description: Full Navier-Stokes fluid simulation with mouse interaction, auto-demo driver, and customizable color palette.
---

::demo-liquid-ether
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/liquid-ether.json"
```

## Props

| Prop                 | Type       | Default                             | Description                                    |
| -------------------- | ---------- | ----------------------------------- | ---------------------------------------------- |
| `mouse-force`        | `number`   | `20`                                | Force applied by mouse movement.               |
| `cursor-size`        | `number`   | `100`                               | Size of the force cursor.                      |
| `is-viscous`         | `boolean`  | `false`                             | Enable viscous diffusion.                      |
| `viscous`            | `number`   | `30`                                | Viscosity coefficient.                         |
| `iterations-viscous` | `number`   | `32`                                | Viscous solver iterations.                     |
| `iterations-poisson` | `number`   | `32`                                | Poisson solver iterations.                     |
| `dt`                 | `number`   | `0.014`                             | Simulation time step.                          |
| `bfecc`              | `boolean`  | `true`                              | Enable BFECC advection.                        |
| `resolution`         | `number`   | `0.5`                               | Simulation resolution (0-1).                   |
| `is-bounce`          | `boolean`  | `false`                             | Enable bouncing boundary.                      |
| `colors`             | `string[]` | `['#5227FF', '#FF9FFC', '#B19EEF']` | Color palette (hex).                           |
| `auto-demo`          | `boolean`  | `true`                              | Enable automatic animation.                    |
| `auto-speed`         | `number`   | `0.5`                               | Auto-demo movement speed.                      |
| `auto-intensity`     | `number`   | `2.2`                               | Auto-demo force intensity.                     |
| `takeover-duration`  | `number`   | `0.25`                              | Transition duration when taking control (sec). |
| `auto-resume-delay`  | `number`   | `1000`                              | Delay before auto-demo resumes (ms).           |
| `auto-ramp-duration` | `number`   | `0.6`                               | Ramp-up duration for auto-demo (sec).          |
