---
title: Target Cursor
description: Animated crosshair cursor that snaps to target elements with corner brackets and smooth lerp tracking.
---

::demo-target-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/target-cursor.json"
```

## Props

| Prop                  | Type      | Default            | Description                            |
| --------------------- | --------- | ------------------ | -------------------------------------- |
| `target-selector`     | `string`  | `'.cursor-target'` | CSS selector for target elements       |
| `spin-duration`       | `number`  | `2`                | Rotation animation duration in seconds |
| `hide-default-cursor` | `boolean` | `true`             | Hide the native cursor                 |
| `hover-duration`      | `number`  | `200`              | Transition duration on hover (ms)      |
