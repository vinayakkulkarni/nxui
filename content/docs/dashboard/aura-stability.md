---
title: Aura Stability
description: A tall frosted-glass capsule with a min/max range chart of speed-test runs, dashed guide lines and a violet glow that rises to the stability score.
---

# Aura Stability

A glass capsule that sums up how steady a connection was over a day. Each run is a vertical track from its smallest to its largest drift, drawn between dashed guide lines. Point at a track, or tab into the chart and use the arrow keys, to read that run's range above the chart. When the capsule first scrolls into view, a violet glow rises from its base and the stability score counts up.

::demo-aura-stability
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/aura-stability.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import AuraStability from '~/components/ui/aura-stability/AuraStability.vue';
  import type {
    AuraStabilityMarker,
    AuraStabilityRun,
  } from '~/components/ui/aura-stability/types';

  const runs: AuraStabilityRun[] = [
    { label: '06:00', min: 3.98, max: 9.14 },
    { label: '09:00', min: 2.65, max: 8.0 },
    { label: '12:00', min: 3.52, max: 9.21 },
    { label: '15:00', min: 5.57, max: 7.75 },
    { label: '18:00', min: 3.88, max: 9.13 },
    { label: '21:00', min: 4.89, max: 7.53 },
  ];
  const markers: AuraStabilityMarker[] = [
    { label: 'B', value: 9.21 },
    { label: 'A', value: 3.52 },
  ];
  const active = ref(-1);
</script>

<template>
  <AuraStability
    v-model:active="active"
    :runs="runs"
    :markers="markers"
    :stability="98.6"
  />
</template>
```

Leave `title` empty and the headline is built from the runs, for example “Six runs across the day. Speed never drifted more than 9.21%”.

## Props

| Prop        | Type                    | Default         | Description                                                       |
| ----------- | ----------------------- | --------------- | ----------------------------------------------------------------- |
| `runs`      | `AuraStabilityRun[]`    | six sample runs | Runs to plot. Each has `label`, `min` and `max` drift in percent. |
| `stability` | `number`                | `98.6`          | Score in percent. It also sets how high the glow rises.           |
| `title`     | `string`                | `''`            | Headline. Empty builds one from the runs.                         |
| `markers`   | `AuraStabilityMarker[]` | B 9.21, A 3.52  | Dashed guide lines, each with a `label` and a `value`.            |
| `label`     | `string`                | `'Stability'`   | Word above the score.                                             |
| `active`    | `number`                | `-1`            | `v-model:active`. Highlighted run; `-1` picks the largest drift.  |
| `backdrop`  | `boolean`               | `true`          | Paints the night-sky stage. Set `false` to use your own.          |
| `class`     | `string`                | `''`            | Extra classes for the root element.                               |

## Events

| Event           | Payload  | Description                                                       |
| --------------- | -------- | ----------------------------------------------------------------- |
| `update:active` | `number` | Fires when a run is hovered, focused or picked with the keyboard. |

## Accessibility

- Each run is a button labelled with its time and range. Only the highlighted run is in the tab order; the arrow keys, Home and End move between runs.
- The highlighted run sets `aria-current`, and its range is read through a polite live region.
- Every run button has a visible focus ring.
- With reduced motion, the glow and the score appear at once and the readout swaps without sliding.
