---
title: Stacked List
description: A media list that rests as an overlapping deck and fans into a full column on hover, with the first row anchoring the stack.
---

::demo-stacked-list
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/stacked-list.json"
```

## Usage

```vue
<script setup lang="ts">
  import StackedList from '~/components/ui/stacked-list/StackedList.vue';
  import type { StackedListItem } from '~/components/ui/stacked-list/types';

  const items: StackedListItem[] = [
    { eyebrow: 'Feb 2, 2025', title: 'Wildflower Fields', image: '/img/1.jpg' },
    { eyebrow: 'Mar 14, 2025', title: 'Storm Rider', image: '/img/2.jpg' },
    { eyebrow: 'Apr 5, 2025', title: 'Golden Hour', image: '/img/3.jpg' },
  ];
</script>

<template>
  <StackedList :items="items" />
</template>
```

By default the deck expands on hover. Set `:expand-on-hover="false"` to make the
first row a click toggle instead. The first row anchors the stack and flips its
chevron up → down; the rest emit `select` with their index when clicked.

## Props

| Prop              | Type                | Default | Description                                               |
| ----------------- | ------------------- | ------- | --------------------------------------------------------- |
| `items`           | `StackedListItem[]` | —       | Rows to render (`eyebrow`, `title`, `image`)              |
| `item-height`     | `number`            | `72`    | Fixed row height in px                                    |
| `gap`             | `number`            | `10`    | Vertical gap between rows when expanded, in px            |
| `peek`            | `number`            | `12`    | Sliver each stacked card peeks when collapsed, in px      |
| `expand-on-hover` | `boolean`           | `true`  | Expand on pointer hover. When `false`, the header toggles |
| `stiffness`       | `number`            | `320`   | Spring stiffness for the collapse/expand motion           |
| `damping`         | `number`            | `34`    | Spring damping for the collapse/expand motion             |

## Events

| Event    | Payload             | Description                              |
| -------- | ------------------- | ---------------------------------------- |
| `toggle` | `expanded: boolean` | Fired when the deck expands or collapses |
| `select` | `index: number`     | Fired when a non-anchor row is clicked   |

## Credits

Inspired by the stacked-list interaction by [@moizarshi29](https://x.com/moizarshi29).
