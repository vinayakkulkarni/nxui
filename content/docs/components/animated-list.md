---
title: Animated List
description: A scrolling list whose rows spring into view from the edge they scroll in from, with a gliding selection and arrow keys.
---

A scrolling list of rows. Rows spring in from the edge they scroll in from, and a selection ring glides between them as you hover or press the arrow keys. Click a row or press Enter to pick it. Rows can show an icon or an image, a description and a label on the right.

::demo-animated-list
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/animated-list.json"
```

## Usage

```vue
<script setup lang="ts">
  import AnimatedList from '~/components/ui/animated-list/AnimatedList.vue';
  import type { AnimatedListItem } from '~/components/ui/animated-list/types';

  const items: AnimatedListItem[] = [
    {
      icon: 'lucide:folder',
      title: 'Brand assets',
      description: '24 files',
      meta: '2m',
    },
    {
      image: 'https://picsum.photos/seed/moon/96/96',
      title: 'Moonrise',
      meta: '4:05',
    },
    'Plain rows work too',
  ];

  function onItemSelect(item: AnimatedListItem, index: number) {
    console.log(item, index);
  }
</script>

<template>
  <AnimatedList
    :items="items"
    animation="slide"
    :loop="true"
    @item-select="onItemSelect"
  />
</template>
```

## Props

| Prop                      | Type                                   | Default         | Description                                                                                                  |
| ------------------------- | -------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| `items`                   | `(string \| AnimatedListEntry)[]`      | 15 sample files | Rows to show. Strings become plain rows. Entries take `id`, `icon`, `image`, `title`, `description`, `meta`. |
| `initial-selected-index`  | `number`                               | `-1`            | Row that starts selected. `-1` for none.                                                                     |
| `select-on-hover`         | `boolean`                              | `true`          | Moves the selection to the row under the pointer.                                                            |
| `enable-arrow-navigation` | `boolean`                              | `true`          | Arrow keys, Home and End move the selection while the list is hovered or focused.                            |
| `loop`                    | `boolean`                              | `false`         | Wraps keyboard navigation from the last row to the first.                                                    |
| `animation`               | `'pop' \| 'slide' \| 'fade' \| 'none'` | `'pop'`         | How rows animate in as they scroll into view.                                                                |
| `animate-once`            | `boolean`                              | `false`         | Animates each row only the first time it appears.                                                            |
| `stagger`                 | `number`                               | `0.05`          | Delay between rows when the list first appears, in seconds.                                                  |
| `show-gradients`          | `boolean`                              | `true`          | Fades rows out at the top and bottom edges while there is more to scroll.                                    |
| `fade-size`               | `number`                               | `56`            | Height of the edge fades, in px.                                                                             |
| `display-scrollbar`       | `boolean`                              | `true`          | Shows a thin scrollbar when the list overflows.                                                              |
| `frame`                   | `boolean`                              | `true`          | Shows the frosted panel around the list.                                                                     |
| `theme`                   | `'dark' \| 'light'`                    | `'dark'`        | Colors of the panel and rows.                                                                                |
| `accent-color`            | `string`                               | —               | Color of the selection ring and focus outline. Uses a soft tint of the text when unset.                      |
| `radius`                  | `number`                               | `14`            | Corner radius of the rows, in px.                                                                            |
| `gap`                     | `number`                               | `8`             | Space between rows, in px.                                                                                   |
| `width`                   | `number \| string`                     | `420`           | Maximum width of the list.                                                                                   |
| `max-height`              | `number \| string`                     | `440`           | Height at which the list starts to scroll.                                                                   |
| `class`                   | `string`                               | `''`            | Extra classes for the list.                                                                                  |
| `item-class`              | `string`                               | `''`            | Extra classes for each row.                                                                                  |

## Events

| Event         | Payload                                   | Description                                                  |
| ------------- | ----------------------------------------- | ------------------------------------------------------------ |
| `item-select` | `[item: AnimatedListItem, index: number]` | A row was clicked, or Enter was pressed on the selected row. |

## Slots

| Slot   | Props                                                          | Description                                                      |
| ------ | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `item` | `{ item: AnimatedListItem, index: number, selected: boolean }` | Your own content inside each row instead of the built-in layout. |

## Accessibility

- The list is a focusable `listbox` and each row is an `option`; `aria-activedescendant` follows the selection.
- `↑` `↓` `Home` `End` move the selection, and the list scrolls to keep it clear of the edge fades. `Enter` (or `Space` while focused) picks it.
- A focus outline in the accent color shows when the list has keyboard focus.
- With `prefers-reduced-motion`, rows only fade and the selection ring jumps instead of gliding.

- Ported from [React Bits](https://reactbits.dev/components/animated-list) by David Haz.
