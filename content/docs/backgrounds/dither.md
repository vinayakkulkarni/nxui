---
title: Dither
description: Retro Bayer-matrix dithered noise shader background.
---

::demo-dither
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dither.json"
```

## Props

| Prop                       | Type                     | Default         | Description                        |
| -------------------------- | ------------------------ | --------------- | ---------------------------------- |
| `wave-speed`               | `number`                 | `0.05`          | Wave animation speed               |
| `wave-frequency`           | `number`                 | `3`             | Wave noise frequency               |
| `wave-amplitude`           | `number`                 | `0.3`           | Wave noise amplitude               |
| `wave-color`               | `[number,number,number]` | `[0.5,0.5,0.5]` | Wave color as RGB triplet          |
| `color-num`                | `number`                 | `4`             | Number of color quantization steps |
| `pixel-size`               | `number`                 | `2`             | Dither pixel size                  |
| `disable-animation`        | `boolean`                | `false`         | Disable wave animation             |
| `enable-mouse-interaction` | `boolean`                | `true`          | Enable mouse interaction           |
| `mouse-radius`             | `number`                 | `1`             | Mouse interaction radius           |
| `class`                    | `string`                 | —               | Additional CSS classes             |
