---
title: Power Monitor
description: A live home-energy card with an LCD readout, a pixel-grid production chart with a time cursor, and a Day, Week, Month and Year switch.
---

# Power Monitor

A home-energy card that shows solar production on an LCD panel. The big reading, home use, battery charge and export drift gently on their own while the card is live. Move the pointer over the pixel chart, drag on it, or focus it and use the arrow keys to move the time cursor; the big reading then shows the value for that column. The segmented control switches the chart between a day, a week, a month and a year.

::demo-power-monitor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/power-monitor.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import PowerMonitor from '~/components/ui/power-monitor/PowerMonitor.vue';
  import type { PowerMonitorRange } from '~/components/ui/power-monitor/types';

  const range = ref<PowerMonitorRange>('day');
</script>

<template>
  <PowerMonitor
    v-model:range="range"
    :solar="4.82"
    :peak="5.7"
    :home="2.14"
    :to-battery="1.96"
    :export-power="0.72"
  />
</template>
```

Pass your own chart data with `series`. Each entry holds the columns for one range: `solar` and `home` values, a cursor label per column, axis ticks, the index of "now" and the summary rows. Columns after `now` are drawn dimmed as a forecast. Without `series` the card uses a generated sample day, week, month and year.

## Props

| Prop            | Type                   | Default       | Description                                                   |
| --------------- | ---------------------- | ------------- | ------------------------------------------------------------- |
| `range`         | `PowerMonitorRange`    | `'day'`       | `v-model:range`. The active range.                            |
| `title`         | `string`               | `'Power now'` | Card title.                                                   |
| `subtitle`      | `string`               | —             | Replaces the automatic "Live · updated 2 s ago" line.         |
| `status`        | `string`               | `'Live'`      | Text in the status pill.                                      |
| `solar`         | `number`               | `4.82`        | Solar production now, in kW.                                  |
| `peak`          | `number`               | `5.7`         | Peak production today, in kW.                                 |
| `home`          | `number`               | `2.14`        | Home use now, in kW.                                          |
| `to-battery`    | `number`               | `1.96`        | Power going into the battery, in kW.                          |
| `export-power`  | `number`               | `0.72`        | Power exported to the grid, in kW.                            |
| `live`          | `boolean`              | `true`        | Live values drift gently. Pauses while the card is offscreen. |
| `interval`      | `number`               | `3000`        | Milliseconds between live updates.                            |
| `series`        | `PowerMonitorSeries[]` | sample data   | Chart data per range.                                         |
| `rows-up`       | `number`               | `11`          | Pixel rows above the baseline.                                |
| `rows-down`     | `number`               | `8`           | Pixel rows below the baseline.                                |
| `color`         | `string`               | `'#ff9a2e'`   | Solar and LCD accent colour.                                  |
| `home-color`    | `string`               | `'#e9e9e9'`   | Home use colour.                                              |
| `battery-color` | `string`               | `'#4ade80'`   | "To battery" reading colour.                                  |
| `export-color`  | `string`               | `'#7ea6ff'`   | "Export" reading colour.                                      |
| `class`         | `string`               | `''`          | Extra classes for the root element.                           |

## Events

| Event          | Payload                      | Description                                                                                                                |
| -------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `update:range` | `PowerMonitorRange`          | Fires when the range changes.                                                                                              |
| `cursor`       | `PowerMonitorCursor \| null` | Fires when the time cursor moves, with the column index, label, values and a forecast flag. `null` when it returns to now. |

## Accessibility

- The chart is a focusable `role="slider"`. Arrow keys move the cursor one column, Page Up and Page Down move it by a larger step, Home and End jump to the ends, and Escape returns it to now. `aria-valuetext` gives the column time.
- The range switch is a `tablist` with arrow-key navigation and `aria-selected`.
- The LCD digits carry an accessible label with the value and unit.
- With reduced motion, the chart reveal and cursor transitions are turned off.
