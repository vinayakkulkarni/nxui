---
title: Particles
description: OGL particle system with velocity simulation, mouse influence, and connection lines.
---

::demo-particles
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/particles.json"
```

## Props

| Prop                  | Type     | Default                   | Description                  |
| --------------------- | -------- | ------------------------- | ---------------------------- |
| `particle-count`      | `number` | `200`                     | Number of particles          |
| `particle-size`       | `number` | `3`                       | Size of each particle        |
| `particle-color`      | `string` | `'#ffffff'`               | Particle color               |
| `speed`               | `number` | `0.3`                     | Movement speed               |
| `connection-distance` | `number` | `100`                     | Max distance for connections |
| `connection-color`    | `string` | `'rgba(255,255,255,0.1)'` | Connection line color        |
| `mouse-influence`     | `number` | `0.02`                    | Mouse attraction strength    |
