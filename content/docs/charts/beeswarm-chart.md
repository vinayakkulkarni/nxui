---
title: Beeswarm Chart
description: A cycle-time dot plot with a machine switch, median and takt lines, a hatched over-takt zone, an axis break for far outliers, hover tooltips and an on-takt footer.
---

# Beeswarm Chart

A beeswarm (dot plot) for cycle times. Every part is one dot on the time axis, and dots that would overlap are pushed up or down so each one stays visible. Parts under takt are green; parts over takt are orange and fall into the hatched zone to the right of the dashed takt line. The white line marks the median, and the pill beside the big median value shows how far it is under or over takt.

Far outliers sit past a `//` axis break, so one slow part does not squeeze the rest of the swarm. The slowest part is ringed and linked to its tooltip by a dotted leader. Hover or focus any dot to see that part instead. The segmented switch changes the machine; the dots move to their new places. The footer counts parts on takt and shows one bar per part; hover a bar to find its dot.

::demo-beeswarm-chart
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/beeswarm-chart.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import BeeswarmChart from '~/components/ui/beeswarm-chart/BeeswarmChart.vue';
  import type { BeeswarmChartSeries } from '~/components/ui/beeswarm-chart/types';

  const series: BeeswarmChartSeries[] = [
    {
      value: 'cnc-07',
      label: 'CNC-07',
      parts: [
        { id: 1189, time: '11:43', value: 42.1 },
        { id: 1188, time: '11:42', value: 43.4 },
        { id: 1187, time: '11:42', value: 58.4, note: 'tool change' },
      ],
    },
    { value: 'cnc-04', label: 'CNC-04', parts: [] },
  ];

  const machine = ref('cnc-07');
</script>

<template>
  <BeeswarmChart
    v-model:machine="machine"
    :series="series"
    :takt="45"
    :domain="[38, 58]"
    :break-at="50"
    :ticks="[38, 44, 50, 58]"
  />
</template>
```

Give every series the same number of parts. Dots are matched by position in the `parts` array, so switching machines moves each dot to its new place instead of redrawing the swarm. The footer bars follow the same order.

## Props

| Prop       | Type                    | Default                     | Description                                                                  |
| ---------- | ----------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `series`   | `BeeswarmChartSeries[]` | —                           | One entry per machine: `value`, `label` and `parts`.                         |
| `takt`     | `number`                | —                           | Target cycle time. Parts above it are over takt.                             |
| `machine`  | `string`                | first series                | `v-model:machine`. The active series value.                                  |
| `title`    | `string`                | `'Cycle Time'`              | Card title.                                                                  |
| `subtitle` | `string`                | `'last N parts · takt T s'` | Line under the title.                                                        |
| `domain`   | `[number, number]`      | data range                  | Axis range. Set it to keep the axis fixed across machines.                   |
| `break-at` | `number`                | —                           | Values above this are drawn past a `//` axis break in a short end segment.   |
| `ticks`    | `number[]`              | domain ends and break       | Labelled ticks. The first label gets the unit. Minor ticks are every 1 unit. |
| `unit`     | `string`                | `'s'`                       | Unit after values.                                                           |
| `class`    | `string`                | `''`                        | Extra classes for the root element.                                          |

## Part options

| Option  | Type               | Description                                                                            |
| ------- | ------------------ | -------------------------------------------------------------------------------------- |
| `id`    | `string \| number` | Part number, shown as `part #id`.                                                      |
| `value` | `number`           | Cycle time.                                                                            |
| `time`  | `string`           | Clock time the part finished, e.g. `11:42`.                                            |
| `note`  | `string`           | Reason shown in the tooltip, e.g. `tool change`. Defaults to `on takt` or `over takt`. |

The layout helpers `dodge`, `createScale` and `median` are exported from `beeswarm-layout.ts` if you want the same swarm in another chart.

## Accessibility

- The machine switch is a `tablist`. Left and Right arrows move between machines.
- Dots are focusable with a roving tab stop. Left and Right (or Down and Up) move to the next slower or faster part; Home and End jump to the fastest and slowest. Each dot has an `aria-label` with the part, time, cycle time and note.
- The median and the takt pill are announced through `aria-live` when the machine changes.
- Dots and the median line only move when the user allows motion; with `prefers-reduced-motion` they jump.
