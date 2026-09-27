---
title: KPI Card
description: A metric card with a counting value, a good-or-bad delta pill, an optional sparkline and an avatar stack.
---

# KPI Card

A metric card for dashboards. The value counts up on mount, the delta pill turns green or red by whether the change is good news (set `invert-delta` for metrics like churn), and an optional sparkline and avatar stack show the trend and the people behind it.

::demo-kpi-card
::

## Usage

```vue
<script setup lang="ts">
  import KpiCard from '~/components/ui/kpi-card/KpiCard.vue';
</script>

<template>
  <KpiCard
    label="Monthly revenue"
    :value="48210"
    format="currency"
    :delta="12.4"
    delta-label="vs last month"
    icon="dollar-sign"
    :trend="[12, 18, 15, 22, 19, 27, 24, 31, 36, 41]"
  />
</template>
```

## Props

| Prop           | Type                                               | Default    | Description                                 |
| -------------- | -------------------------------------------------- | ---------- | ------------------------------------------- |
| `label`        | `string`                                           | —          | Metric name                                 |
| `value`        | `number`                                           | —          | Current value; counts up on mount           |
| `format`       | `'number' \| 'currency' \| 'percent' \| 'compact'` | `'number'` | How the value is formatted                  |
| `currency`     | `string`                                           | `'USD'`    | ISO 4217 code for `currency` format         |
| `delta`        | `number`                                           | —          | Percent change, e.g. `12.4` or `-3.1`       |
| `delta-label`  | `string`                                           | `''`       | Text after the delta, e.g. `vs last month`  |
| `invert-delta` | `boolean`                                          | `false`    | Treats a falling value as good news         |
| `icon`         | `string`                                           | `''`       | Lucide icon name without the prefix         |
| `trend`        | `number[]`                                         | `[]`       | Renders a sparkline with two or more values |
| `avatars`      | `{ src: string; alt: string }[]`                   | `[]`       | People behind the metric                    |
| `max-avatars`  | `number`                                           | `4`        | Avatars shown before `+N`                   |

KPI Card uses the Sparkline component when `trend` is set; the CLI installs it for you.

Motion respects `prefers-reduced-motion`.
