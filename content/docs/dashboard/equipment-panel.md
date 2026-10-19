---
title: Equipment Panel
description: A home-energy equipment card with three LCD readouts, a device table with segmented level bars and rows that open to a live chart.
---

# Equipment Panel

An overview of the devices behind a home battery system. Three LCD tiles show battery charge, inverter output and grid flow, each with a segmented bar. Below them, click a device row (or press Enter on it) to open it; a row with a chart shows a live line against its limit and an action button. The All / Alerts switch filters the table to the rows that need attention. With `live` on, the values drift a little every couple of seconds so the panel looks connected.

::demo-equipment-panel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/equipment-panel.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import EquipmentPanel from '~/components/ui/equipment-panel/EquipmentPanel.vue';
  import type {
    EquipmentDevice,
    EquipmentTile,
  } from '~/components/ui/equipment-panel/types';

  const expanded = ref<string | null>('inverter');

  const tiles: EquipmentTile[] = [
    {
      key: 'battery',
      label: 'Battery',
      note: '17.3 kWh',
      value: 64,
      unit: '%',
      level: 0.64,
      color: '#4ade80',
    },
  ];

  const devices: EquipmentDevice[] = [
    {
      id: 'inverter',
      name: 'Inverter',
      detail: 'Hybrid · 7.6 kW',
      status: 'warn',
      level: 0.8,
      power: 4.82,
      temp: 41,
      action: 'Run check',
      chart: {
        label: 'Heatsink temp',
        points: [34, 36, 38, 39],
        limit: 45,
        limitLabel: 'Limit 45 °C',
        note: 'Fan 70 %',
      },
    },
  ];
</script>

<template>
  <EquipmentPanel
    v-model:expanded="expanded"
    :tiles="tiles"
    :devices="devices"
    @action="(d) => console.log(d.id)"
  />
</template>
```

Rows with `status: 'warn'` count as alerts. Rows without a `chart` open to a small level and power readout.

## Props

| Prop        | Type                | Default                          | Description                                                                       |
| ----------- | ------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| `tiles`     | `EquipmentTile[]`   | Battery, Inverter, Grid          | LCD tiles: `key`, `label`, `note`, `value`, `decimals`, `unit`, `level`, `color`. |
| `devices`   | `EquipmentDevice[]` | Five devices                     | Table rows. See the device options below.                                         |
| `expanded`  | `string \| null`    | `'inverter'`                     | `v-model:expanded`. Id of the open row.                                           |
| `filter`    | `'all' \| 'alerts'` | `'all'`                          | `v-model:filter`. Which rows show.                                                |
| `live`      | `boolean`           | `true`                           | Nudges values every 1.8 s while the card is on screen.                            |
| `title`     | `string`            | `'Equipment'`                    | Header title.                                                                     |
| `subtitle`  | `string`            | Device count                     | Header subtitle.                                                                  |
| `icon`      | `string`            | `'lucide:text'`                  | Icon in the header chip.                                                          |
| `firmware`  | `string`            | `'Firmware 26.4.1 · up to date'` | Footer status text.                                                               |
| `add-label` | `string`            | `'Add device'`                   | Text of the add button.                                                           |
| `accent`    | `string`            | `'#ff9a2e'`                      | Warnings, LCD labels, the open row border and charts.                             |
| `ok-color`  | `string`            | `'#4ade80'`                      | Healthy status dots.                                                              |
| `class`     | `string`            | `''`                             | Extra classes for the root element.                                               |

## Device options

| Option       | Type                       | Description                                              |
| ------------ | -------------------------- | -------------------------------------------------------- |
| `id`         | `string`                   | Unique id.                                               |
| `name`       | `string`                   | First line.                                              |
| `detail`     | `string`                   | Second line.                                             |
| `status`     | `'ok' \| 'warn' \| 'idle'` | Dot colour. `warn` rows are alerts.                      |
| `level`      | `number`                   | Level bar fill, 0 to 1.                                  |
| `levelColor` | `string`                   | Level bar colour.                                        |
| `power`      | `number`                   | Power in kW.                                             |
| `signed`     | `boolean`                  | Adds `+` to positive power.                              |
| `temp`       | `number \| null`           | Temperature in °C. `null` shows a dash.                  |
| `chart`      | `EquipmentChart`           | `label`, `points`, `limit`, `limitLabel`, `note`, `min`. |
| `action`     | `string`                   | Label of the button in the open row.                     |

## Events

| Event             | Payload             | Description                             |
| ----------------- | ------------------- | --------------------------------------- |
| `update:expanded` | `string \| null`    | A row opened or closed.                 |
| `update:filter`   | `'all' \| 'alerts'` | The filter changed.                     |
| `action`          | `EquipmentDevice`   | The action button in a row was pressed. |
| `add`             | —                   | Add device was pressed.                 |

## Accessibility

- Each row is a button with `aria-expanded` and `aria-controls`. Closed details are `inert`, so they are skipped by Tab.
- The All / Alerts switch is a `role="tablist"`; the arrow keys move between the two tabs.
- Level bars are `role="meter"` with `aria-valuenow`, and every LCD readout has an `aria-label` with its value and unit.
- The live drift and the transitions stop when the user prefers reduced motion or the card is off screen.
