---
title: Animated List
description: Scroll-triggered list with scale entrance, keyboard navigation, and gradient edges.
---

::demo-animated-list
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/animated-list.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `string[]` | `['Item 1', ..., 'Item 15']` | List items to display |
| `show-gradients` | `boolean` | `true` | Show top/bottom scroll gradients |
| `enable-arrow-navigation` | `boolean` | `true` | Allow Arrow/Tab keyboard navigation |
| `display-scrollbar` | `boolean` | `true` | Show the scrollbar |
| `initial-selected-index` | `number` | `-1` | Initially selected item index |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `[item: string, index: number]` | Emitted when an item is clicked or Enter is pressed |
