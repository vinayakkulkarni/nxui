---
title: Productivity Dashboard
description: A dark daily-overview card with an energy chart, a sleep tile that expands into a hypnogram, a focus timer with presets and an ambient sound player.
---

# Productivity Dashboard

A daily overview in one card. The tabs switch the time range: the energy percentage rolls digit by digit, the bars spring to their new heights and the peak tooltip follows the tallest bar. Open the `⋯` menu on Focus to pick a preset; the timer starts at once, the ring fills as time passes and the sound waveform comes alive. The expand button on Sleep grows the tile into a full-width sleep-stage chart that draws itself; close it to collapse back. The demo plays this tour on its own until you touch it.

::demo-productivity-dashboard
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/productivity-dashboard.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ProductivityDashboard from '~/components/ui/productivity-dashboard/ProductivityDashboard.vue';
  import type { ProductivityRange } from '~/components/ui/productivity-dashboard/types';

  const range = ref('today');
  const expanded = ref(false);

  const ranges: ProductivityRange[] = [
    {
      value: 'today',
      label: 'Today',
      average: 78,
      caption: 'Average today',
      delta: '+6% vs yesterday',
      trend: 'up',
      bars: [
        { label: '6a', value: 24 },
        { label: '12p', value: 80 },
        { label: '6p', value: 68 },
      ],
    },
  ];
</script>

<template>
  <ProductivityDashboard
    v-model:range="range"
    v-model:expanded="expanded"
    name="Mira"
    date="Tuesday, 17 November"
    :ranges="ranges"
  />
</template>
```

Every data prop has a default, so `<ProductivityDashboard />` renders the full card. The defaults are exported as `DEFAULT_RANGES`, `DEFAULT_SLEEP`, `DEFAULT_SESSIONS` and `DEFAULT_SOUND` if you want to change one field.

## Props

| Prop       | Type                    | Default                  | Description                                                           |
| ---------- | ----------------------- | ------------------------ | --------------------------------------------------------------------- |
| `range`    | `string`                | first range              | `v-model:range`. The active tab value.                                |
| `expanded` | `boolean`               | `false`                  | `v-model:expanded`. Shows the full sleep view over the grid.          |
| `name`     | `string`                | `'Mira'`                 | Person greeted in the header.                                         |
| `greeting` | `string`                | `'Good evening'`         | Text before the name.                                                 |
| `date`     | `string`                | `'Tuesday, 17 November'` | Line under the greeting.                                              |
| `avatar`   | `string`                | `''`                     | Avatar image URL. Initials show when empty.                           |
| `ranges`   | `ProductivityRange[]`   | three ranges             | Tabs and energy data, one entry per tab.                              |
| `sleep`    | `ProductivitySleep`     | sample night             | Sleep tile, dot matrix and hypnogram data.                            |
| `sessions` | `ProductivitySession[]` | Pomodoro, Deep work, …   | Focus presets in the menu. The first one is the value after **Stop**. |
| `sound`    | `ProductivitySound`     | `Rain on glass`          | Title and subtitle of the sound player.                               |
| `unread`   | `boolean`               | `true`                   | Shows the dot on the bell button.                                     |
| `class`    | `string`                | `''`                     | Extra classes for the root element.                                   |

## Data shapes

| Type                    | Fields                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `ProductivityRange`     | `value`, `label`, `average` (0–100), `caption`, `delta`, `trend` (`'up' \| 'down'`), `bars`          |
| `ProductivityBar`       | `label`, `value` (0–100). The tallest bar gets the tooltip.                                          |
| `ProductivitySleep`     | `duration`, `summary`, `period`, `columns` (0–4 lit dots each), `stats`, `steps`, `ticks`, `insight` |
| `ProductivitySleepStep` | `stage` (0 deep, 1 light, 2 REM, 3 awake), `minutes`                                                 |
| `ProductivityTick`      | `at` (minutes after the start of the night), `label`                                                 |
| `ProductivitySession`   | `id`, `label`, `minutes`, `icon` (Lucide name without the prefix)                                    |

## Events

| Event           | Payload               | Description                                 |
| --------------- | --------------------- | ------------------------------------------- |
| `start`         | `ProductivitySession` | A focus session started.                    |
| `stop`          | —                     | The running session was stopped.            |
| `complete`      | `ProductivitySession` | The timer reached `00:00`.                  |
| `open-energy`   | `ProductivityRange`   | The chevron on the Energy tile was clicked. |
| `notifications` | —                     | The bell button was clicked.                |

## Methods

Call these through a template ref: `start(id?)`, `stop()`, `select(id)`, `openMenu()`, `closeMenu()`, `expand()`, `collapse()` and `setRange(value)`.

## Accessibility

- The range switch is a `tablist`. Arrow keys, Home and End move between tabs, and the Energy tile is the `tabpanel`.
- The Focus menu is a `menu` of `menuitemradio` items. Arrow keys move, Enter selects, Escape closes and returns focus to the trigger.
- The timer uses `role="timer"`, and the sound status is announced through `aria-live`.
- The expanded sleep view is labelled as a dialog. Escape or the close button collapses it, and focus moves between the expand and close buttons.
- Charts have text labels for screen readers. With reduced motion on, every transition is instant and the waveform stays still.
