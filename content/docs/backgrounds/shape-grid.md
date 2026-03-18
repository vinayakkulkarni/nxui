---
title: Shape Grid
description: An animated grid of shapes with hover trail effects and directional movement.
---

::demo-shape-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shape-grid.json"
```

## Props

| Prop                 | Type                                                | Default    | Description              |
| -------------------- | --------------------------------------------------- | ---------- | ------------------------ |
| `direction`          | `'diagonal' \| 'up' \| 'right' \| 'down' \| 'left'` | `'right'`  | Grid scroll direction    |
| `speed`              | `number`                                            | `1`        | Animation speed          |
| `border-color`       | `string`                                            | `'#999'`   | Shape border color       |
| `square-size`        | `number`                                            | `40`       | Size of each grid cell   |
| `hover-fill-color`   | `string`                                            | `'#222'`   | Hover highlight color    |
| `shape`              | `'square' \| 'hexagon' \| 'circle' \| 'triangle'`   | `'square'` | Shape type               |
| `hover-trail-amount` | `number`                                            | `0`        | Number of trailing cells |
