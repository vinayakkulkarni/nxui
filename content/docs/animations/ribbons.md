---
title: Ribbons
description: Interactive OGL ribbon lines that follow mouse movement with spring physics.
---

::demo-ribbons
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ribbons.json"
```

## Props

| Prop                   | Type       | Default       | Description                        |
| ---------------------- | ---------- | ------------- | ---------------------------------- |
| `colors`               | `string[]` | `['#FC8EAC']` | Array of ribbon colors             |
| `base-spring`          | `number`   | `0.03`        | Spring stiffness for ribbon follow |
| `base-friction`        | `number`   | `0.9`         | Friction damping factor            |
| `base-thickness`       | `number`   | `30`          | Ribbon line thickness              |
| `offset-factor`        | `number`   | `0.05`        | Offset between ribbons             |
| `max-age`              | `number`   | `500`         | Trail decay time in ms             |
| `point-count`          | `number`   | `50`          | Points per ribbon line             |
| `speed-multiplier`     | `number`   | `0.6`         | Animation speed factor             |
| `enable-fade`          | `boolean`  | `false`       | Enable fade-out along ribbon       |
| `enable-shader-effect` | `boolean`  | `false`       | Enable sine-wave shader distortion |
| `effect-amplitude`     | `number`   | `2`           | Shader effect amplitude            |
| `background-color`     | `number[]` | `[0,0,0,0]`   | RGBA background color              |
