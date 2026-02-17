---
title: Gradient Text
description: Animated flowing gradient across text with customizable colors and speed.
---

::demo-gradient-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gradient-text.json"
```

## Props

| Prop     | Type       | Default                                                   | Description                         |
| -------- | ---------- | --------------------------------------------------------- | ----------------------------------- |
| `text`   | `string`   | —                                                         | The text content to display         |
| `colors` | `string[]` | `['#40ffaa', '#4079ff', '#40ffaa', '#4079ff', '#40ffaa']` | Gradient color stops                |
| `speed`  | `number`   | `8`                                                       | Animation cycle duration in seconds |
| `class`  | `string`   | —                                                         | Additional CSS classes              |
