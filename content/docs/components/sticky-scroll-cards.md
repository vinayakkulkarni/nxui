---
title: Sticky Scroll Cards
description: Scroll-driven card stack where images pin and scale as you scroll.
---

::demo-sticky-scroll-cards
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/sticky-scroll-cards.json"
```

## Props

| Prop    | Type                     | Default | Description                              |
| ------- | ------------------------ | ------- | ---------------------------------------- |
| `cards` | `StickyScrollCardItem[]` | `[]`    | Array of card objects with title and src |
| `hint`  | `string`                 | `''`    | Hint label shown above card stack        |
| `class` | `string`                 | `''`    | Additional CSS classes                   |

### StickyScrollCardItem

| Field   | Type     | Description |
| ------- | -------- | ----------- |
| `title` | `string` | Card title  |
| `src`   | `string` | Image URL   |
