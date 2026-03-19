---
title: Shiny Text
description: A configurable shimmering text highlight with animation speed, direction, yoyo, and pause-on-hover controls.
---

::demo-shiny-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shiny-text.json"
```

## Props

| Prop             | Type                | Default     | Description                                |
| ---------------- | ------------------- | ----------- | ------------------------------------------ |
| `text`           | `string`            | —           | The text content to display                |
| `disabled`       | `boolean`           | `false`     | Disable the shiny animation                |
| `speed`          | `number`            | `2`         | Animation speed (seconds per cycle)        |
| `color`          | `string`            | `'#b5b5b5'` | Base text color                            |
| `shine-color`    | `string`            | `'#ffffff'` | Shine highlight color                      |
| `spread`         | `number`            | `120`       | Gradient angle in degrees                  |
| `yoyo`           | `boolean`           | `false`     | Ping-pong animation (forward then reverse) |
| `pause-on-hover` | `boolean`           | `false`     | Pause animation on hover                   |
| `direction`      | `'left' \| 'right'` | `'left'`    | Animation sweep direction                  |
| `delay`          | `number`            | `0`         | Pause between cycles (seconds)             |
