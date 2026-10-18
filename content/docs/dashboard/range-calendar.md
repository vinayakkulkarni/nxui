---
title: Range Calendar
description: A month heatmap calendar for picking a date range, with presets, a live range pill, a shaded legend and a compare switch.
---

# Range Calendar

A date-range picker that is also a heatmap. Each day is a rounded square shaded by its value, from fewer to more. Click a day to start a range and click another to end it; the days between get a soft band, and the pill above shows the dates and the length. While you pick, hovering a day previews the range. Presets set the range in one click, and the switch turns on a comparison with the previous period. Days after `today` and days without data show a dashed outline and cannot be picked.

::demo-range-calendar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/range-calendar.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import RangeCalendar from '~/components/ui/range-calendar/RangeCalendar.vue';
  import type { RangeCalendarDay } from '~/components/ui/range-calendar/types';

  const days: RangeCalendarDay[] = [
    { date: '2026-09-01', value: 142 },
    { date: '2026-09-02', value: 61 },
  ];

  const start = ref('2026-09-04');
  const end = ref('2026-09-25');
  const preset = ref('1M');
  const compare = ref(true);
</script>

<template>
  <RangeCalendar
    v-model:start="start"
    v-model:end="end"
    v-model:preset="preset"
    v-model:compare="compare"
    today="2026-09-28"
    :days="days"
    title="Time Range"
    subtitle="Line 3 · all cells"
  />
</template>
```

Dates are plain `YYYY-MM-DD` strings. The component does calendar math on day numbers in UTC, so the time zone never moves a day. Pass `today` yourself instead of reading the clock, so the server and the browser render the same month.

Picking days by hand clears `preset`. Each preset ends on `today`; presets with `hours` cover `today` only and show the hours in the pill.

## Props

| Prop            | Type                    | Default               | Description                                                                   |
| --------------- | ----------------------- | --------------------- | ----------------------------------------------------------------------------- |
| `today`         | `string`                | —                     | The current day, `YYYY-MM-DD`. Later days are disabled; presets end here.     |
| `start`         | `string`                | `''`                  | `v-model`. First day of the range, `YYYY-MM-DD`.                              |
| `end`           | `string`                | `''`                  | `v-model`. Last day of the range, `YYYY-MM-DD`.                               |
| `preset`        | `string`                | `''`                  | `v-model`. Value of the active preset, or `''` for a custom range.            |
| `compare`       | `boolean`               | `false`               | `v-model`. State of the compare switch.                                       |
| `month`         | `string`                | month of `today`      | Month to show, `YYYY-MM`.                                                     |
| `days`          | `RangeCalendarDay[]`    | `[]`                  | `{ date, value }` per day. Shades the heatmap. Days without an entry are off. |
| `title`         | `string`                | `'Time Range'`        | Card heading.                                                                 |
| `subtitle`      | `string`                | `''`                  | Line under the heading.                                                       |
| `presets`       | `RangeCalendarPreset[]` | `12h 24h 1W 1M 3M`    | `{ value, label, days, hours? }` buttons above the grid.                      |
| `unit`          | `string`                | `'stops'`             | Noun for the value, used in the legend and the day labels.                    |
| `legend-low`    | `string`                | `'fewer <unit>'`      | Left legend label.                                                            |
| `legend-high`   | `string`                | `'more'`              | Right legend label.                                                           |
| `compare-title` | `string`                | `'Compare'`           | Label next to the switch.                                                     |
| `compare-label` | `string`                | `'previous <N> days'` | Text under the label. `N` is the preset length, or the range length.          |
| `locale`        | `string`                | `'en-US'`             | Locale for month and weekday names.                                           |
| `class`         | `string`                | `''`                  | Extra classes for the root element.                                           |

## Accessibility

- The month is a `role="grid"` with weekday column headers. Each day is a button with a full label, for example "Friday, September 4, 2026, 33 stops".
- Arrow keys move between days, Home and End jump to the ends of the week, Enter or Space picks a day, and Escape cancels a half-picked range. Only one day is in the tab order.
- Days in the range set `aria-selected`. Disabled days set `aria-disabled` and stay focusable so the keyboard can pass over them. Today sets `aria-current="date"`.
- The range pill is announced through `aria-live`. Presets are toggle buttons with `aria-pressed`.
- The compare control is a `role="switch"` button with `aria-checked`.
- Transitions turn off with `prefers-reduced-motion`.
