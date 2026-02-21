---
title: Scroll Stack
description: Scroll-driven stacked card animation with scale and sticky positioning effects.
---

::demo-scroll-stack
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-stack.json"
```

## Props

| Prop               | Type         | Default | Description                      |
| ------------------ | ------------ | ------- | -------------------------------- |
| `cards`            | `CardItem[]` | `[]`    | Array of card objects            |
| `card-height`      | `number`     | `320`   | Height of each card in px        |
| `card-gap`         | `number`     | `30`    | Gap between cards in px          |
| `sticky-top`       | `number`     | `80`    | Top offset for sticky cards (px) |
| `scale-multiplier` | `number`     | `0.03`  | Scale reduction per stacked card |

### CardItem

| Field         | Type               | Description       |
| ------------- | ------------------ | ----------------- |
| `id`          | `string \| number` | Unique identifier |
| `title`       | `string`           | Card title        |
| `description` | `string`           | Card description  |
| `color`       | `string`           | Background color  |
