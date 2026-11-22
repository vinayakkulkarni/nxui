---
title: Usage Meter
description: A plan usage card with a range switch, a rolling credit total, a stacked category meter, a per-day bar chart, quota stats and a limit state.
---

# Usage Meter

A plan usage card for AI credits or any metered quota. Pick a range in the segmented control and the total rolls to the new value, the stacked meter and the rows animate, and the per-day bars grow in. Hover a meter segment or a category row to highlight it and see its share. Hover a day bar, or focus the chart and use the arrow keys, to read that day. When usage reaches the limit, the footer switches from credits left and **Upgrade** to **Limit reached** and **Add credits**. The demo cycles through the ranges on its own.

::demo-usage-meter
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/usage-meter.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import UsageMeter from '~/components/ui/usage-meter/UsageMeter.vue';
  import type {
    UsageMeterCategory,
    UsageMeterRange,
  } from '~/components/ui/usage-meter/types';

  const categories: UsageMeterCategory[] = [
    { key: 'chat', label: 'Chat', color: '#2f5bea', darkColor: '#6573f6' },
    { key: 'search', label: 'Search', color: '#7091f2', darkColor: '#4553c8' },
    { key: 'image', label: 'Image', color: '#b4c4f8', darkColor: '#2c357c' },
    { key: 'api', label: 'API', color: '#9d9da6', darkColor: '#64646d' },
  ];

  const ranges: UsageMeterRange[] = [
    {
      value: 'month',
      label: 'This month',
      usage: { chat: 3980, search: 1640, image: 1120, api: 680 },
      daily: [310, 190, 180, 320, 560],
      days: 30,
      stats: [
        { label: 'Seats', value: 8, max: 10 },
        { label: 'Storage', value: 3.2, max: 5, unit: 'GB' },
        { label: 'Projects', value: 12 },
      ],
    },
  ];

  const range = ref('month');
</script>

<template>
  <UsageMeter
    v-model:range="range"
    plan="Pro plan"
    resets="Resets in 9 days"
    :limit="10000"
    :categories="categories"
    :ranges="ranges"
  />
</template>
```

The total is the sum of the category values in the active range. Categories with a value of `0` collapse out of the list. Day slots after the last `daily` value are drawn as flat future days. A stat without `max` is unlimited and shows `∞` with a hatched track. A stat at 80% or more of its `max` gets a warning dot.

## Props

| Prop                | Type                   | Default           | Description                                                             |
| ------------------- | ---------------------- | ----------------- | ----------------------------------------------------------------------- |
| `categories`        | `UsageMeterCategory[]` | —                 | Categories in meter order: `key`, `label`, `color`, `darkColor`.        |
| `ranges`            | `UsageMeterRange[]`    | —                 | Ranges for the segmented control, each with its own data.               |
| `range`             | `string`               | `''`              | `v-model:range`. The active range value. Falls back to the first range. |
| `workspace`         | `string`               | `'nxui'`          | Workspace name in the header.                                           |
| `plan`              | `string`               | `'Pro plan'`      | Plan name under the workspace.                                          |
| `resets`            | `string`               | `''`              | Text after the plan, e.g. `Resets in 9 days`.                           |
| `limit`             | `number`               | `10000`           | Usage limit. At or over it, the card shows the limit state.             |
| `unit`              | `string`               | `'credits'`       | Unit shown after numbers.                                               |
| `accent`            | `string`               | `''`              | Colour of a hovered day bar. Defaults to the first category colour.     |
| `upgrade-label`     | `string`               | `'Upgrade'`       | Footer button text below the limit.                                     |
| `add-credits-label` | `string`               | `'Add credits'`   | Footer button text at the limit.                                        |
| `limit-label`       | `string`               | `'Limit reached'` | Footer text at the limit.                                               |
| `class`             | `string`               | `''`              | Extra classes for the root element.                                     |

## Range options

| Option      | Type                     | Description                                               |
| ----------- | ------------------------ | --------------------------------------------------------- |
| `value`     | `string`                 | Range id, used by `v-model:range`.                        |
| `label`     | `string`                 | Text in the segmented control.                            |
| `usage`     | `Record<string, number>` | Usage per category key.                                   |
| `daily`     | `number[]`               | Usage per day.                                            |
| `days`      | `number`                 | Total day slots. Extra slots are drawn as future days.    |
| `dayLabels` | `string[]`               | Label per day slot, e.g. `Oct 5`. Defaults to `Day N`.    |
| `stats`     | `UsageMeterStat[]`       | Quota stats: `label`, `value`, optional `max` and `unit`. |

## Events

| Event          | Payload  | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `range-change` | `string` | Fires when the user picks another range. |
| `upgrade`      | —        | Fires when **Upgrade** is clicked.       |
| `add-credits`  | —        | Fires when **Add credits** is clicked.   |

## Accessibility

- The range switch is a `tablist`. Arrow keys, Home and End move between ranges.
- The meter uses `role="meter"` with `aria-valuenow`, `aria-valuemax` and a text value.
- Category rows are focusable. Focus highlights the row and its meter segment.
- The per-day chart is focusable. Arrow keys, Home and End read each day, and the label is announced through `aria-live`.
- The limit state is announced with `role="status"`.
- All motion stops when the user prefers reduced motion.
