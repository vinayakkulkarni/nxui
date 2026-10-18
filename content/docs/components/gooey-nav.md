---
title: Gooey Nav
description: A navigation bar whose active pill breaks into goo that flows over to the item you pick.
---

Click an item and the active pill melts into droplets that arc across the bar and pool into a new pill under that item. A WebGL2 metaball shader draws the goo, and the active text is clipped to the same shape. Hover an item to see a soft highlight behind it.

::demo-gooey-nav
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gooey-nav.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import GooeyNav from '~/components/ui/gooey-nav/GooeyNav.vue';

  const items = [
    { label: 'Home', href: '#', icon: 'lucide:house' },
    { label: 'Work', href: '#', icon: 'lucide:briefcase' },
    { label: 'About', href: '#', icon: 'lucide:user' },
    { label: 'Contact', href: '#', icon: 'lucide:mail' },
  ];
  const active = ref(0);
</script>

<template>
  <GooeyNav
    v-model:active-index="active"
    :items="items"
    theme="dark"
    color="#ff5a1f"
    :colors="['#ff5a1f', '#ff8a3a', '#ffb020']"
    :particle-count="15"
    :spread="56"
  />
</template>
```

## Props

| Prop                   | Type                   | Default     | Description                                                               |
| ---------------------- | ---------------------- | ----------- | ------------------------------------------------------------------------- |
| `items`                | `GooeyNavItem[]`       | 4 samples   | The navigation items. Items without an `href` render as buttons.          |
| `initial-active-index` | `number`               | `0`         | Which item starts selected.                                               |
| `active-index`         | `number`               | `undefined` | Controls the selected item. Use with `v-model:active-index`.              |
| `theme`                | `'dark' \| 'light'`    | `'dark'`    | Color theme of the frame and text.                                        |
| `color`                | `string`               | `undefined` | Color of the active pill. Uses a high-contrast theme color when unset.    |
| `active-text-color`    | `string`               | `undefined` | Text color inside the pill. Picked from the pill color when unset.        |
| `colors`               | `string[]`             | `[]`        | Droplet colors. They blend as they merge. Uses the pill color when empty. |
| `size`                 | `'sm' \| 'md' \| 'lg'` | `'md'`      | Size of the items.                                                        |
| `frame`                | `boolean`              | `true`      | Shows the frosted panel around the items.                                 |
| `animation-time`       | `number`               | `600`       | Roughly how long the droplets take to reach the new item, in ms.          |
| `particle-count`       | `number`               | `15`        | How many droplets the pill breaks into.                                   |
| `spread`               | `number`               | `56`        | How far the droplets scatter on the way, in px.                           |
| `time-variance`        | `number`               | `300`       | Random variation in each droplet's timing, in ms.                         |
| `gooeyness`            | `number`               | `0.5`       | How readily droplets and pills melt together, from 0 to 1.                |
| `wobble`               | `number`               | `0.5`       | How much the new pill wobbles as it forms, from 0 to 1.                   |
| `hover-effect`         | `boolean`              | `true`      | Shows a soft highlight behind the hovered item.                           |
| `class`                | `string`               | `''`        | Extra classes for the `<nav>`.                                            |

### GooeyNavItem

| Field   | Type     | Description                                |
| ------- | -------- | ------------------------------------------ |
| `label` | `string` | Display text                               |
| `href`  | `string` | Link URL. Leave it out to render a button. |
| `icon`  | `string` | Iconify name, e.g. `lucide:house`          |

## Events

| Event                | Payload                               | Description                    |
| -------------------- | ------------------------------------- | ------------------------------ |
| `change`             | `(index: number, item: GooeyNavItem)` | Fired when an item is picked.  |
| `update:activeIndex` | `(index: number)`                     | Drives `v-model:active-index`. |

## Accessibility

- Renders a `<nav>` with real `<a>` links (or `<button>` without `href`). The current item gets `aria-current="page"`.
- Every link has a visible focus ring. The canvas and the clipped text copy are `aria-hidden`.
- With `prefers-reduced-motion: reduce`, the pill jumps to the new item with no droplets.
- Without WebGL2, a plain pill moves to the active item instead.

- Ported from [React Bits](https://reactbits.dev/components/gooey-nav) by David Haz.
