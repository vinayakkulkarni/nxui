---
title: Radar
description: An animated radar sweep background with concentric rings and radial spokes.
---

::demo-radar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/radar.json"
```

## Props

| Prop                       | Type      | Default     | Description          |
| -------------------------- | --------- | ----------- | -------------------- |
| `speed`                    | `number`  | `1.0`       | Animation speed      |
| `scale`                    | `number`  | `0.5`       | Zoom level           |
| `ring-count`               | `number`  | `10`        | Number of rings      |
| `spoke-count`              | `number`  | `10`        | Number of spokes     |
| `sweep-speed`              | `number`  | `1.0`       | Sweep rotation speed |
| `color`                    | `string`  | `'#9f29ff'` | Primary color        |
| `background-color`         | `string`  | `'#000000'` | Background color     |
| `enable-mouse-interaction` | `boolean` | `true`      | Cursor tracking      |
