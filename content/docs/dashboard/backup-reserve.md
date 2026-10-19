---
title: Backup Reserve
description: A battery reserve setting with an LCD readout, a segmented charge bar, a slider, preset buttons, a storm watch switch and a grid charging stepper.
---

# Backup Reserve

A settings card for the share of a home battery held back for outages. Drag the slider, use its arrow keys, or press a preset; the LCD number, the hours estimate and the segmented bar follow at once. The bar shows the reserved part, the usable part above it and the free space. Below, a switch turns storm watch on and the stepper sets the grid charging rate. Cancel restores the last saved values and Save keeps the new ones.

::demo-backup-reserve
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/backup-reserve.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import BackupReserve from '~/components/ui/backup-reserve/BackupReserve.vue';
  import type { BackupReserveSettings } from '~/components/ui/backup-reserve/types';

  const reserve = ref(30);
  const stormWatch = ref(true);
  const gridRate = ref(3.8);

  function onSave(settings: BackupReserveSettings) {
    console.log(settings);
  }
</script>

<template>
  <BackupReserve
    v-model:reserve="reserve"
    v-model:storm-watch="stormWatch"
    v-model:grid-rate="gridRate"
    :battery="64"
    :capacity="13.5"
    :essential-load="0.45"
    @save="onSave"
  />
</template>
```

The hours estimate is `reserve × capacity ÷ essential-load`, rounded. With the defaults, a 30 % reserve of 13.5 kWh covers about 9 hours of a 0.45 kW essential load.

## Props

| Prop                | Type       | Default                          | Description                                        |
| ------------------- | ---------- | -------------------------------- | -------------------------------------------------- |
| `reserve`           | `number`   | `30`                             | `v-model:reserve`. Reserve held back, 0–100 %.     |
| `storm-watch`       | `boolean`  | `true`                           | `v-model:storm-watch`. The storm watch switch.     |
| `grid-rate`         | `number`   | `3.8`                            | `v-model:grid-rate`. Max grid charging rate in kW. |
| `battery`           | `number`   | `64`                             | Current battery charge, 0–100 %.                   |
| `capacity`          | `number`   | `13.5`                           | Battery capacity in kWh.                           |
| `essential-load`    | `number`   | `0.45`                           | Load of the essential circuits in kW.              |
| `presets`           | `number[]` | `[10, 20, 30, 50, 80, 100]`      | Quick-pick reserve values.                         |
| `cells`             | `number`   | `25`                             | Segments in the LCD bar.                           |
| `charging`          | `boolean`  | `true`                           | Blinks the top battery segment.                    |
| `grid-rate-min`     | `number`   | `0`                              | Lowest grid charging rate.                         |
| `grid-rate-max`     | `number`   | `11.5`                           | Highest grid charging rate.                        |
| `grid-rate-step`    | `number`   | `0.2`                            | Step of the − and + buttons.                       |
| `title`             | `string`   | `'Backup reserve'`               | Card title.                                        |
| `subtitle`          | `string`   | `'Held back for outages'`        | Line under the title.                              |
| `status`            | `string`   | `'Grid up'`                      | Text in the status pill. Hidden when empty.        |
| `storm-title`       | `string`   | `'Storm watch'`                  | Switch title.                                      |
| `storm-description` | `string`   | `'Fills to 100 % before alerts'` | Switch description.                                |
| `grid-title`        | `string`   | `'Grid charging'`                | Stepper title.                                     |
| `grid-description`  | `string`   | `'Max rate from the grid'`       | Stepper description.                               |
| `cancel-label`      | `string`   | `'Cancel'`                       | Cancel button text.                                |
| `save-label`        | `string`   | `'Save'`                         | Save button text.                                  |
| `color`             | `string`   | `'#ff9a2e'`                      | Reserve and LCD accent colour.                     |
| `usable-color`      | `string`   | `'#4ade80'`                      | Colour of the usable part of the battery.          |
| `class`             | `string`   | `''`                             | Extra classes for the root element.                |

## Events

| Event                | Payload                 | Description                                                |
| -------------------- | ----------------------- | ---------------------------------------------------------- |
| `update:reserve`     | `number`                | Fires on every slider, preset or key change.               |
| `update:storm-watch` | `boolean`               | Fires when the switch toggles.                             |
| `update:grid-rate`   | `number`                | Fires when the stepper changes.                            |
| `save`               | `BackupReserveSettings` | Fires on Save with `reserve`, `stormWatch` and `gridRate`. |
| `cancel`             | —                       | Fires on Cancel, after the last saved values are restored. |

## Accessibility

- The slider thumb has `role="slider"` with `aria-valuenow`. Arrow keys change it by 1, Page Up and Page Down by 10, Home and End jump to the ends.
- The presets are a `radiogroup`. Arrow keys move the selection.
- Storm watch is a `role="switch"` with `aria-checked`.
- The grid rate readout is a `role="spinbutton"`; arrow keys change it, and the − and + buttons have labels.
- With reduced motion, the number tween, slider glide and switch spring are turned off.
