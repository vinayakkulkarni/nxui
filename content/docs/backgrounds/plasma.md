---
title: Plasma
description: WebGL2 ray-marched plasma background with mouse interaction, configurable colors, speed, and direction.
---

::demo-plasma
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/plasma.json"
```

## Props

| Prop                | Type                                   | Default     | Description                              |
| ------------------- | -------------------------------------- | ----------- | ---------------------------------------- |
| `color`             | `string`                               | `'#ffffff'` | Hex color to tint the plasma effect      |
| `speed`             | `number`                               | `1`         | Animation speed multiplier               |
| `direction`         | `'forward' \| 'reverse' \| 'pingpong'` | `'forward'` | Time flow direction                      |
| `scale`             | `number`                               | `1`         | Scale of the plasma pattern              |
| `opacity`           | `number`                               | `1`         | Output opacity of the effect             |
| `mouse-interactive` | `boolean`                              | `true`      | Enable mouse influence on the ray origin |
| `class`             | `string`                               | —           | Additional CSS classes                   |
