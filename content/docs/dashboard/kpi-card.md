---
title: KPI Card
description: A metric card with a tinted icon, an actions button, a counting value and a stack of avatars or initials.
---

# KPI Card

A compact metric card for dashboard summary rows. The icon sits in a small box tinted by `accent`, a matching glow fills the top corner, and the value counts up on mount. People behind the metric show as an overlapping stack; anyone without a photo, or whose photo fails to load, shows as an initial.

::demo-kpi-card
::

## Usage

```vue
<script setup lang="ts">
  import KpiCard from '~/components/ui/kpi-card/KpiCard.vue';
  import type { KpiPerson } from '~/components/ui/kpi-card/types';

  const people: KpiPerson[] = [
    { name: 'Maya', src: '/avatars/maya.jpg' },
    { name: 'Leo' },
    { name: 'Ava', src: '/avatars/ava.jpg' },
  ];
</script>

<template>
  <KpiCard
    label="Total Users"
    :value="356"
    icon="users"
    accent="violet"
    :people="people"
    @menu="openMenu"
  />
</template>
```

## Props

| Prop         | Type                                                   | Default    | Description                         |
| ------------ | ------------------------------------------------------ | ---------- | ----------------------------------- |
| `label`      | `string`                                               | —          | Metric name                         |
| `value`      | `number`                                               | —          | Current value; counts up on mount   |
| `icon`       | `string`                                               | —          | Lucide icon name without the prefix |
| `accent`     | `'violet' \| 'emerald' \| 'blue' \| 'rose' \| 'amber'` | `'violet'` | Tints the icon and corner glow      |
| `people`     | `{ name: string; src?: string }[]`                     | `[]`       | People behind the metric            |
| `max-people` | `number`                                               | `3`        | People shown before `+N`            |
| `show-menu`  | `boolean`                                              | `true`     | Shows the actions button            |

The actions button emits `menu` with the click event, so you can open your own dropdown.

Motion respects `prefers-reduced-motion`.
