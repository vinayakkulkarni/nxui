---
title: Border Beam
description: A moving gradient beam that travels along the border of its container. Perfect for highlighting active states.
---

::demo-border-beam
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/border-beam.json"
```

## Props

| Prop           | Type     | Default     | Description                        |
| -------------- | -------- | ----------- | ---------------------------------- |
| `size`         | `number` | `200`       | Length of the beam in pixels       |
| `duration`     | `number` | `15`        | Animation duration in seconds      |
| `border-width` | `number` | `1.5`       | Width of the border/beam in pixels |
| `color-from`   | `string` | `'#ffaa40'` | Start color of the gradient        |
| `color-to`     | `string` | `'#9c40ff'` | End color of the gradient          |
| `delay`        | `number` | `0`         | Animation delay in seconds         |
