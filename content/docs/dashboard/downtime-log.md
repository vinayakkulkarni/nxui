---
title: Downtime Log
description: A machine downtime card with selectable stops, reason pills, a reason filter, sort modes and a linked 24-hour stop timeline.
---

# Downtime Log

A compact log of machine stops for shop-floor dashboards. Each row shows when the stop started, a colored reason pill and its length in minutes; long stops turn orange. Select rows with the checkboxes and the footer sums their minutes. Below the list, a 24-hour timeline draws every stop as colored ticks on a ruler per machine. Hover a row to light up its stop on the timeline, or hover a stop to find its row.

::demo-downtime-log
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/downtime-log.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import DowntimeLog from '~/components/ui/downtime-log/DowntimeLog.vue';
  import type {
    DowntimeReason,
    DowntimeStop,
  } from '~/components/ui/downtime-log/types';

  const reasons: DowntimeReason[] = [
    { value: 'tooling', label: 'Tooling', color: '#f5d03b' },
    { value: 'material', label: 'Material', color: '#3ee0d8' },
    { value: 'maint', label: 'Maint', color: '#a46cf5' },
  ];

  const stops: DowntimeStop[] = [
    {
      id: 's01',
      startedAt: '2026-09-24T14:08',
      reason: 'tooling',
      minutes: 42,
      machine: 'CNC-04',
    },
    {
      id: 's02',
      startedAt: '2026-09-24T09:51',
      reason: 'material',
      minutes: 18,
      machine: 'Weld-1',
    },
  ];

  const selected = ref<string[]>(['s01']);

  function assign(rows: DowntimeStop[]): void {
    console.log('Assign cause to', rows);
  }
</script>

<template>
  <DowntimeLog
    v-model:selected="selected"
    :stops="stops"
    :reasons="reasons"
    now="2026-09-24T16:20"
    @assign="assign"
  />
</template>
```

Times are wall-clock strings (`YYYY-MM-DDTHH:mm`). They are not converted between time zones, so the server and the browser render the same text.

## Props

| Prop             | Type               | Default          | Description                                                         |
| ---------------- | ------------------ | ---------------- | ------------------------------------------------------------------- |
| `stops`          | `DowntimeStop[]`   | —                | The stops to list. See the stop fields below.                       |
| `reasons`        | `DowntimeReason[]` | —                | Reasons with a label and a color. Also the options of the filter.   |
| `now`            | `string`           | —                | Current time, `YYYY-MM-DDTHH:mm`. The timeline ends here.           |
| `selected`       | `string[]`         | `[]`             | `v-model:selected`. Ids of the selected stops.                      |
| `hidden-reasons` | `string[]`         | `[]`             | `v-model:hidden-reasons`. Reasons the filter hides.                 |
| `sort`           | `DowntimeSort`     | `'newest'`       | `v-model:sort`. `'newest'`, `'oldest'` or `'longest'`.              |
| `machines`       | `string[]`         | stop order       | Timeline tracks, top to bottom.                                     |
| `title`          | `string`           | `'Downtime Log'` | Card title.                                                         |
| `period`         | `string`           | `'this week'`    | Text after the stop count.                                          |
| `threshold`      | `number`           | `30`             | Stops longer than this many minutes show their minutes in orange.   |
| `window-hours`   | `number`           | `24`             | Hours covered by the timeline. It starts on the hour.               |
| `axis-step`      | `number`           | `6`              | Hours between x-axis labels.                                        |
| `tick-minutes`   | `number`           | `20`             | Minutes between two ruler ticks. A stop colors the ticks it covers. |
| `visible-rows`   | `number`           | `5`              | Rows shown before the list scrolls.                                 |
| `class`          | `string`           | `''`             | Extra classes for the root element.                                 |

## Stop fields

| Field       | Type     | Description                               |
| ----------- | -------- | ----------------------------------------- |
| `id`        | `string` | Unique id. Links the row to its timeline. |
| `startedAt` | `string` | Start time, `YYYY-MM-DDTHH:mm`.           |
| `reason`    | `string` | A `DowntimeReason` value.                 |
| `minutes`   | `number` | Length of the stop.                       |
| `machine`   | `string` | Machine that stopped.                     |

## Events

| Event    | Payload          | Description                                         |
| -------- | ---------------- | --------------------------------------------------- |
| `export` | `DowntimeStop[]` | The Export button. Sends the filtered, sorted rows. |
| `assign` | `DowntimeStop[]` | The Assign Cause button. Sends the selected stops.  |

## Accessibility

- Each row is a focusable `role="checkbox"` with `aria-checked`. Space or Enter toggles it. The arrow keys move between rows.
- The header checkbox sets `aria-checked="mixed"` when only some rows are selected.
- The filter is a menu of `menuitemcheckbox` items. Escape or a click outside closes it.
- The selected count and minutes are announced through `aria-live`.
- Each timeline stop has a text label with its machine, reason, time and length.
- Transitions turn off when the user prefers reduced motion.
