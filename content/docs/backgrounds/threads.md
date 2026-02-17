---
title: Threads
description: Animated Perlin noise thread lines with mouse-reactive distortion and configurable color.
---

::demo-threads
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/threads.json"
```

## Props

| Prop                       | Type                       | Default     | Description                           |
| -------------------------- | -------------------------- | ----------- | ------------------------------------- |
| `color`                    | `[number, number, number]` | `[1, 1, 1]` | RGB color of the threads (0–1 range). |
| `amplitude`                | `number`                   | `1`         | Amplitude of the wave distortion.     |
| `distance`                 | `number`                   | `0`         | Spread distance between thread lines. |
| `enable-mouse-interaction` | `boolean`                  | `false`     | Enable mouse-reactive distortion.     |
