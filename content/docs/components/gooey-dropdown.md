---
title: Gooey Dropdown
description: A pill trigger whose menu items stretch out of it with a gooey metaball merge before snapping into discrete buttons.
---

::demo-gooey-dropdown
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gooey-dropdown.json"
```

## Usage

```vue
<script setup lang="ts">
  import GooeyDropdown from '~/components/ui/gooey-dropdown/GooeyDropdown.vue';
  import type { GooeyDropdownItem } from '~/components/ui/gooey-dropdown/types';

  const items: GooeyDropdownItem[] = [
    { label: 'Copy link', icon: 'lucide:link' },
    { label: 'Twitter', icon: 'lucide:twitter' },
    { label: 'Email', icon: 'lucide:mail' },
  ];
</script>

<template>
  <GooeyDropdown label="Share" :items="items" />
</template>
```

Clicking the trigger unfurls the items, which appear to stretch out of the pill
with a gooey metaball merge (an SVG blur + contrast filter fuses the blobs) and
snap into discrete buttons. Set `:direction="'up'"` to unfurl upward. Each pick
emits `select`.

## Props

| Prop        | Type                  | Default            | Description                                         |
| ----------- | --------------------- | ------------------ | --------------------------------------------------- |
| `label`     | `string`              | `'Share'`          | Trigger label                                       |
| `icon`      | `string`              | `'lucide:share-2'` | Optional `@nuxt/icon` name for the trigger          |
| `items`     | `GooeyDropdownItem[]` | —                  | Menu items (`label`, optional `icon`)               |
| `direction` | `'up' \| 'down'`      | `'down'`           | Direction the items unfurl                          |
| `gap`       | `number`              | `52`               | Distance between blobs in px (smaller = more merge) |
| `stiffness` | `number`              | `420`              | Spring stiffness for the unfurl                     |
| `damping`   | `number`              | `32`               | Spring damping for the unfurl                       |

## Events

| Event         | Payload                            | Description                      |
| ------------- | ---------------------------------- | -------------------------------- |
| `select`      | `{ label: string, index: number }` | Fired when an item is chosen     |
| `update:open` | `open: boolean`                    | Fired when the menu opens/closes |

## Credits

Inspired by the gooey dropdown interaction by [@nexvyn](https://x.com/nexvyn).
