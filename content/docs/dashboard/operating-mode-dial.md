---
title: Operating Mode Dial
description: A knurled rotary knob that snaps between battery operating modes, with an LCD description panel, schedule tabs and a 24-hour rate strip.
---

# Operating Mode Dial

A control card for a home battery. Turn the knob to pick a mode: drag it around, click a mode label, or focus it and use the arrow keys. It springs to the nearest mode and the lit dot, the LCD panel and `v-model` follow. The tabs switch the rate schedule, and the strip under them shades each hour as off-peak, mid or peak with the peak window underlined. Cancel goes back to the last applied mode.

::demo-operating-mode-dial
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/operating-mode-dial.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import OperatingModeDial from '~/components/ui/operating-mode-dial/OperatingModeDial.vue';

  const mode = ref('time-based');
  const schedule = ref('weekdays');

  function save(value: string): void {
    console.log('apply', value);
  }
</script>

<template>
  <OperatingModeDial v-model="mode" v-model:schedule="schedule" @apply="save" />
</template>
```

Pass your own `modes` to change the positions. Each mode takes an `angle` in degrees, clockwise from 12 o'clock, between -135 and 135. Modes without an angle spread evenly.

## Props

| Prop           | Type                      | Default                      | Description                                                        |
| -------------- | ------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `model-value`  | `string`                  | `'time-based'`               | `v-model`. The selected mode value.                                |
| `modes`        | `OperatingModeOption[]`   | Four battery modes           | Dial positions: `value`, `label`, `title`, `description`, `angle`. |
| `schedule`     | `string`                  | First schedule               | `v-model:schedule`. The selected schedule tab.                     |
| `schedules`    | `OperatingModeSchedule[]` | Weekdays, Weekends, Holidays | Tabs, each with 24 hourly tiers: `'off'`, `'mid'` or `'peak'`.     |
| `prices`       | `OperatingModePrices`     | `$0.11 / $0.24 / $0.48`      | Legend text for each tier.                                         |
| `title`        | `string`                  | `'Operating mode'`           | Header title.                                                      |
| `subtitle`     | `string`                  | `'Battery and inverter'`     | Header subtitle.                                                   |
| `badge`        | `string`                  | `'Auto'`                     | Pill at the top right. `''` hides it.                              |
| `icon`         | `string`                  | `'lucide:circle-gauge'`      | Icon in the header chip.                                           |
| `accent`       | `string`                  | `'#ff9a2e'`                  | Colour of the lit mode dot and the LCD text.                       |
| `peak-color`   | `string`                  | `'#4ade80'`                  | Colour of the line under the peak window.                          |
| `cancel-label` | `string`                  | `'Cancel'`                   | Text of the cancel button.                                         |
| `apply-label`  | `string`                  | `'Apply mode'`               | Text of the apply button.                                          |
| `class`        | `string`                  | `''`                         | Extra classes for the root element.                                |

## Events

| Event               | Payload  | Description                                                     |
| ------------------- | -------- | --------------------------------------------------------------- |
| `update:modelValue` | `string` | The knob settled on a new mode.                                 |
| `update:schedule`   | `string` | A schedule tab was picked.                                      |
| `change`            | `string` | Same as `update:modelValue`.                                    |
| `apply`             | `string` | Apply was pressed. The mode becomes the cancel point.           |
| `cancel`            | —        | Cancel was pressed. The mode goes back to the last applied one. |

## Accessibility

- The knob is a `role="slider"` with `aria-valuenow` and `aria-valuetext` set to the mode name. Arrow keys step between modes, Home and End jump to the ends.
- Each mode label is a button with `aria-pressed`.
- The schedule tabs use `role="tablist"` and `role="tab"` with roving focus on the arrow keys.
- The LCD panel is an `aria-live` region, so the new mode description is read out.
- The spring and the colour transitions turn off when the user prefers reduced motion.
