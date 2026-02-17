---
title: Count Up
description: Animated number counter with easeOutExpo easing, triggered on scroll into view.
---

::demo-count-up
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/count-up.json"
```

## Props

| Prop        | Type     | Default | Description                      |
| ----------- | -------- | ------- | -------------------------------- |
| `to`        | `number` | —       | The target number to count up to |
| `from`      | `number` | `0`     | The starting number              |
| `duration`  | `number` | `2`     | Animation duration in seconds    |
| `separator` | `string` | `','`   | Thousands separator character    |
| `decimals`  | `number` | `0`     | Number of decimal places         |
| `class`     | `string` | —       | Additional CSS classes           |
