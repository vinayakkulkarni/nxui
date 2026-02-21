---
title: Laser Flow
description: Three.js volumetric laser beams with fog, mouse tilt, and flow animation using GLSL shaders.
---

::demo-laser-flow
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/laser-flow.json"
```

## Props

| Prop                     | Type     | Default     | Description                       |
| ------------------------ | -------- | ----------- | --------------------------------- |
| `wisp-density`           | `number` | `1`         | Number of light wisps             |
| `mouse-tilt-strength`    | `number` | `0.01`      | Mouse tilt sensitivity            |
| `horizontal-beam-offset` | `number` | `0.1`       | Horizontal beam position offset   |
| `vertical-beam-offset`   | `number` | `0.0`       | Vertical beam position offset     |
| `flow-speed`             | `number` | `0.35`      | Flow animation speed              |
| `vertical-sizing`        | `number` | `2.0`       | Vertical beam scale               |
| `horizontal-sizing`      | `number` | `0.5`       | Horizontal beam scale             |
| `fog-intensity`          | `number` | `0.45`      | Fog density                       |
| `fog-scale`              | `number` | `0.3`       | Fog pattern scale                 |
| `wisp-speed`             | `number` | `15.0`      | Wisp animation speed              |
| `wisp-intensity`         | `number` | `5.0`       | Wisp brightness                   |
| `flow-strength`          | `number` | `0.25`      | Flow distortion strength          |
| `color`                  | `string` | —           | Beam color                        |
