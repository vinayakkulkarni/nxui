---
title: Notification Center
description: Frosted notification panel with a badged bell trigger, spring-animated rows that expand in place, live relative timestamps, and layout-animated add/read flows.
---

::demo-notification-center
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/notification-center.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import NotificationCenter from '~/components/ui/notification-center/NotificationCenter.vue';
  import type { NotificationCenterItem } from '~/components/ui/notification-center/types';

  const items = ref<NotificationCenterItem[]>([
    {
      id: 1,
      title: 'New Feature Available',
      message: 'Collaborative editing is now live!',
      icon: '💡',
      timestamp: Date.now(),
      unread: true,
    },
  ]);
</script>

<template>
  <NotificationCenter v-model="items" label="Notifications" align="right" />
</template>
```

The bell shows a spring-scaled unread badge. Opening reveals a frosted
panel; clicking a truncated row expands it in place (`layout` animation
reflows siblings) and marks it read. New items pushed to the front of the
`v-model` array drop in with a spring; timestamps re-render live every
second. Escape or clicking outside closes the panel.

## Props

| Prop      | Type                       | Default           | Description                 |
| --------- | -------------------------- | ----------------- | --------------------------- |
| `v-model` | `NotificationCenterItem[]` | —                 | Notification list (mutable) |
| `label`   | `string`                   | `'Notifications'` | Panel heading               |
| `align`   | `'left' \| 'right'`        | `'right'`         | Side the panel grows from   |

### NotificationCenterItem

| Field       | Type               | Description                              |
| ----------- | ------------------ | ---------------------------------------- |
| `id`        | `number \| string` | Unique key                               |
| `title`     | `string`           | Row title (truncates until expanded)     |
| `message`   | `string`           | Body text (truncates until expanded)     |
| `icon`      | `string`           | Emoji in the icon square                 |
| `timestamp` | `number`           | Epoch ms, rendered as live relative time |
| `unread`    | `boolean`          | Shows the red dot + counts toward badge  |

## Events

| Event  | Payload                  | Description                  |
| ------ | ------------------------ | ---------------------------- |
| `read` | `NotificationCenterItem` | Fired when a row is expanded |

## Credits

Ported from the notification panel interaction by
[@divv919](https://x.com/divv919/status/2076000393616830810).
