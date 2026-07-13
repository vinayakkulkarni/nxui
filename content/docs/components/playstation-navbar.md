---
title: PlayStation Navbar
description: XMB-style cross-media navigation — a sliding category rail, vertical items with a glowing pill cursor, and full arrow-key control.
---

::demo-playstation-navbar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/playstation-navbar.json"
```

## Usage

```vue
<script setup lang="ts">
  import PlaystationNavbar from '~/components/ui/playstation-navbar/PlaystationNavbar.vue';

  const categories = [
    {
      id: 'product',
      label: 'Product',
      icon: 'lucide:settings',
      items: [
        {
          id: 'editor',
          label: 'Editor',
          description: 'Build without code',
          icon: 'lucide:pencil',
        },
        { id: 'api', label: 'API', icon: 'lucide:file-code' },
      ],
    },
  ];
</script>

<template>
  <div class="relative h-150 overflow-hidden bg-sky-700">
    <PlaystationNavbar :categories="categories" />
  </div>
</template>
```

A faithful PS3/PSP cross-media-bar: the horizontal category rail slides so
the active category always sits on the cross column — its icon brightens
into a glowing white tile. Sub-items hang vertically beneath it, and a
frosted pill cursor springs between rows, with the active item's label
swelling and its description unfurling beneath a hairline. Arrow keys
navigate (←/→ categories, ↑/↓ items); clicking works too. On small
screens labels collapse below the cross to keep the rail centered.

## Props

| Prop         | Type                          | Default | Description        |
| ------------ | ----------------------------- | ------- | ------------------ |
| `categories` | `PlaystationNavbarCategory[]` | —       | The cross-bar tree |

### PlaystationNavbarCategory

| Field   | Type                      | Description                 |
| ------- | ------------------------- | --------------------------- |
| `id`    | `string`                  | Unique id                   |
| `label` | `string`                  | Shown under the active icon |
| `icon`  | `string`                  | Iconify name for the rail   |
| `items` | `PlaystationNavbarItem[]` | Vertical entries            |

### PlaystationNavbarItem

| Field         | Type     | Description                       |
| ------------- | -------- | --------------------------------- |
| `id`          | `string` | Unique id                         |
| `label`       | `string` | Item label                        |
| `description` | `string` | Line revealed while selected      |
| `icon`        | `string` | Iconify name (rail + cursor pill) |

## Events

| Event    | Payload                                | Description   |
| -------- | -------------------------------------- | ------------- |
| `select` | `(categoryId: string, itemId: string)` | Item selected |

## Credits

Ported from the PlayStation-style navbar by
[@ozzyxs1a](https://x.com/ozzyxs1a/status/2075952407347913043).
