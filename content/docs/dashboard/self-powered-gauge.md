---
title: Self-Powered Gauge
description: An analog needle meter for the share of home energy covered without the grid, with a source breakdown bar and a seven-day segment chart.
---

# Self-Powered Gauge

An analog meter that shows how much of the home's energy came from solar and the battery. The needle springs to the value, overshoots a little and settles, then trembles slightly like a live meter. Below it, a stacked bar splits today's energy by source; hover a source to pick it out. The last row shows the past days as segmented columns with today highlighted. Hover or focus a day to read its value.

::demo-self-powered-gauge
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/self-powered-gauge.json"
```

## Usage

```vue
<script setup lang="ts">
  import SelfPoweredGauge from '~/components/ui/self-powered-gauge/SelfPoweredGauge.vue';
  import type {
    SelfPoweredDay,
    SelfPoweredSource,
  } from '~/components/ui/self-powered-gauge/types';

  const sources: SelfPoweredSource[] = [
    { label: 'Solar, direct', value: 7.2, color: '#ff9a2e' },
    { label: 'Battery', value: 2.9, color: '#4ade80' },
    { label: 'Grid', value: 1.7, color: '#7ea6ff' },
  ];

  const history: SelfPoweredDay[] = [
    { label: 'M', name: 'Monday', value: 68 },
    { label: 'T', name: 'Tuesday', value: 79 },
    { label: 'W', name: 'Wednesday', value: 80 },
    { label: 'T', name: 'Thursday', value: 86 },
  ];
</script>

<template>
  <SelfPoweredGauge
    :value="86"
    badge="+9 pts"
    :zone-from="80"
    :sources="sources"
    :history="history"
  />
</template>
```

The last `history` entry is today. Its column always follows `value`, so the meter and the chart agree.

## Props

| Prop            | Type                  | Default                | Description                                              |
| --------------- | --------------------- | ---------------------- | -------------------------------------------------------- |
| `value`         | `number`              | `86`                   | Self-powered share, 0–100. The needle springs to it.     |
| `title`         | `string`              | `'Self-powered'`       | Card title.                                              |
| `subtitle`      | `string`              | `'Today, so far'`      | Line under the title.                                    |
| `badge`         | `string`              | `'+9 pts'`             | Pill on the right of the header. Hidden when empty.      |
| `label`         | `string`              | `'Self-powered'`       | Small caps label inside the meter.                       |
| `zone-from`     | `number`              | `80`                   | Where the accent zone on the scale starts.               |
| `sources`       | `SelfPoweredSource[]` | solar, battery, grid   | Energy per source, drawn as a stacked bar with a legend. |
| `unit`          | `string`              | `'kWh'`                | Unit for source values.                                  |
| `sources-label` | `string`              | `'Where it came from'` | Heading of the source breakdown.                         |
| `history`       | `SelfPoweredDay[]`    | seven sample days      | One column per day. The last one is today.               |
| `history-label` | `string`              | `'Last 7 days'`        | Heading of the day chart.                                |
| `segments`      | `number`              | `10`                   | Segments per day column.                                 |
| `jitter`        | `number`              | `0.5`                  | Needle tremble in points. `0` turns it off.              |
| `color`         | `string`              | `'#ff9a2e'`            | Accent for the zone, the readout and today's column.     |
| `class`         | `string`              | `''`                   | Extra classes for the root element.                      |

## Events

| Event       | Payload                  | Description                                                     |
| ----------- | ------------------------ | --------------------------------------------------------------- |
| `day-hover` | `SelfPoweredDay \| null` | Fires when a day column is hovered or focused, `null` on leave. |

## Accessibility

- The meter has `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and a text value.
- Each day column is a button labelled with the day and its value. Focus shows the value in the heading, which is announced through `aria-live`.
- With reduced motion, the needle jumps to its value without the spring or tremble, and bar transitions are turned off.
- The animation pauses while the meter is offscreen.
