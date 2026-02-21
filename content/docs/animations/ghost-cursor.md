---
title: Ghost Cursor
description: Three.js-powered ghostly cursor trail with bloom, grain, and FBM noise effects.
---

::demo-ghost-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ghost-cursor.json"
```

## Props

| Prop                    | Type     | Default     | Description                          |
| ----------------------- | -------- | ----------- | ------------------------------------ |
| `trail-length`          | `number` | `50`        | Number of trail points               |
| `inertia`               | `number` | `0.5`       | Trail inertia (0-1)                  |
| `grain-intensity`       | `number` | `0.05`      | Film grain noise intensity           |
| `bloom-strength`        | `number` | `0.1`       | Unreal bloom strength                |
| `bloom-radius`          | `number` | `1.0`       | Bloom radius                         |
| `bloom-threshold`       | `number` | `0.025`     | Bloom luminance threshold            |
| `brightness`            | `number` | `1`         | Overall brightness                   |
| `color`                 | `string` | `'#B19EEF'` | Trail color                          |
| `mix-blend-mode`        | `string` | `'screen'`  | CSS blend mode                       |
| `edge-intensity`        | `number` | `0`         | Edge glow intensity                  |
| `max-device-pixel-ratio` | `number` | `0.5`      | Max DPR for performance              |
| `fade-delay-ms`         | `number` | `1000`      | Delay before fade on idle (ms)       |
| `fade-duration-ms`      | `number` | `2000`      | Fade out duration (ms)               |
