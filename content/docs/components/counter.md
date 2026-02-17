---
title: Counter
description: Animated number counter with spring-physics digit rolling and gradient fade overlays.
---

::demo-counter
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/counter.json"
```

## Props

| Prop                 | Type     | Default         | Description                         |
| -------------------- | -------- | --------------- | ----------------------------------- |
| `value`              | `number` | —               | The number to display (required)    |
| `font-size`          | `number` | `100`           | Font size in pixels                 |
| `padding`            | `number` | `0`             | Extra vertical padding per digit    |
| `gap`                | `number` | `8`             | Gap between digits in pixels        |
| `border-radius`      | `number` | `4`             | Border radius of container          |
| `horizontal-padding` | `number` | `8`             | Horizontal padding of container     |
| `text-color`         | `string` | `'inherit'`     | Digit text color                    |
| `font-weight`        | `string` | `'inherit'`     | Digit font weight                   |
| `gradient-height`    | `number` | `16`            | Height of top/bottom fade gradients |
| `gradient-from`      | `string` | `'black'`       | Gradient start color                |
| `gradient-to`        | `string` | `'transparent'` | Gradient end color                  |
