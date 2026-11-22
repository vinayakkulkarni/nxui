---
title: Liquid Tabs
description: A notifications card whose active tab is liquid. It slides under the next label on a spring and flows into the card body on the way.
---

# Liquid Tabs

A notifications card with folder-style tabs. The card body and the active tab sit under one goo filter, so the tab reads as part of the card and flows into it as it slides to another label. Rows leave toward the tab you came from and arrive from the one you went to. Click a row to select it; its avatar inverts. The chevron opens more tabs, and the one you pick replaces the third tab. Arrow keys move between tabs.

::demo-liquid-tabs
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/liquid-tabs.json"
```

## Usage

```vue
<script setup lang="ts">
  import { computed, ref } from 'vue';
  import LiquidTabs from '~/components/ui/liquid-tabs/LiquidTabs.vue';
  import type {
    LiquidTabsItem,
    LiquidTabsTab,
  } from '~/components/ui/liquid-tabs/types';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));
  const tab = ref('inbox');

  const tabs: LiquidTabsTab[] = [
    {
      key: 'inbox',
      label: 'Inbox',
      rows: [
        {
          id: 'i1',
          title: 'Build passed',
          subtitle: 'main · 2m 14s',
          time: '09:12',
          icon: 'lucide:circle-check',
        },
        {
          id: 'i2',
          title: 'Deploy',
          subtitle: 'Preview ready',
          time: '09:20',
          icon: 'lucide:rocket',
        },
      ],
    },
  ];

  function onSelect(item: LiquidTabsItem, key: string) {
    console.log(key, item.id);
  }
</script>

<template>
  <LiquidTabs
    v-model:tab="tab"
    :tabs="tabs"
    :rows="2"
    :corner="20"
    :theme="theme"
    @select="onSelect"
  />
</template>
```

Without `tabs` and `overflow` the card shows its built-in notification data: All and Mentions up front, and System, Archived and Requests in the menu. Setting `tab` to an overflow key makes that tab the third one.

## Props

| Prop       | Type                | Default           | Description                                                    |
| ---------- | ------------------- | ----------------- | -------------------------------------------------------------- |
| `tab`      | `string`            | first tab key     | `v-model`. The active tab key.                                 |
| `corner`   | `number`            | `20`              | Corner radius of the card in px, clamped to 0–40.              |
| `rows`     | `2 \| 3 \| 4`       | `4`               | How many rows each tab shows. The card height follows it.      |
| `theme`    | `'light' \| 'dark'` | `'light'`         | Colour theme. Pass your site's colour mode.                    |
| `tabs`     | `LiquidTabsTab[]`   | All, Mentions     | The fixed leading tabs.                                        |
| `overflow` | `LiquidTabsTab[]`   | System, Archived… | Tabs in the chevron menu. The picked one becomes the last tab. |
| `label`    | `string`            | `'Notifications'` | Accessible name of the tab list.                               |
| `class`    | `string`            | `''`              | Extra classes for the root element.                            |

A `LiquidTabsTab` has a `key`, a `label`, `rows` and an optional `selected` row id. Each row has an `id`, `title`, `subtitle`, `time` and an `icon`: an Iconify name such as `lucide:inbox`, or one of the built-in glyphs `dome`, `shield-outline` and `shield-notch`.

## Events

| Event    | Payload                               | Description                                     |
| -------- | ------------------------------------- | ----------------------------------------------- |
| `select` | `(item: LiquidTabsItem, tab: string)` | Fires when a row is selected, with its tab key. |

## Accessibility

- The tabs use `role="tablist"` and `role="tab"` with `aria-selected` and a roving `tabindex`. Left and Right arrows move between tabs and wrap.
- The rows sit in a `role="tabpanel"`. Each row is an option in a listbox with `aria-selected`.
- The chevron sets `aria-haspopup="menu"` and `aria-expanded`. The menu uses `role="menu"` and `menuitemradio` items with `aria-checked`. Opening it focuses the checked item; Up, Down, Home and End move focus; Escape closes it and returns focus to the chevron. A press outside also closes it.
- Focus rings are visible on tabs, rows, the chevron and menu items.
- With reduced motion the tab moves without a spring, rows only cross-fade and the avatar does not bounce.

Ported from [Liquid Tabs](https://pinui.xyz/components/liquid-tabs) by Pin UI, MIT licence.
