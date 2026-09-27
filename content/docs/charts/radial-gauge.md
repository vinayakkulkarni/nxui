---
title: Radial Gauge
description: A 270° gauge with a rounded value arc, threshold colors, and a readout that counts up to the value.
---

# Radial Gauge

A 270° gauge for load, scores and quotas. The value arc sweeps up from the minimum with rounded ends while the readout counts up, and threshold bands recolor the arc as the value crosses them.

::demo-radial-gauge
::

## Usage

```vue
<script setup lang="ts">
  import RadialGauge from '~/components/ui/radial-gauge/RadialGauge.vue';
  import type { RadialGaugeThreshold } from '~/components/ui/radial-gauge/types';

  const thresholds: RadialGaugeThreshold[] = [
    { from: 0, color: 'var(--chart-2)' },
    { from: 70, color: 'var(--chart-4)' },
    { from: 90, color: 'var(--chart-5)' },
  ];
</script>

<template>
  <RadialGauge :value="68" unit="%" label="CPU load" :thresholds="thresholds" />
</template>
```

## Props

| Prop         | Type                                | Default            | Description                                  |
| ------------ | ----------------------------------- | ------------------ | -------------------------------------------- |
| `value`      | `number`                            | —                  | Current value, clamped to `min`…`max`        |
| `min`        | `number`                            | `0`                | Lower bound                                  |
| `max`        | `number`                            | `100`              | Upper bound                                  |
| `label`      | `string`                            | `''`               | Caption under the value                      |
| `unit`       | `string`                            | `''`               | Appended to the readout                      |
| `size`       | `number`                            | `220`              | Diameter in pixels                           |
| `thickness`  | `number`                            | `16`               | Arc thickness in pixels                      |
| `sweep`      | `number`                            | `270`              | Arc sweep in degrees, centered on 12 o'clock |
| `color`      | `string`                            | `'var(--chart-2)'` | Arc color when no threshold matches          |
| `thresholds` | `{ from: number; color: string }[]` | `[]`               | Colors the arc by the highest band reached   |
| `aria-label` | `string`                            | derived            | Defaults to the label and value              |

Motion respects `prefers-reduced-motion`: the chart jumps to its final state instead of animating.

## Use TanStack Charts instead

Every chart imports its engine from one file, `components/ui/chart/chart-backend.ts`. The default engine is a small, dependency-free SVG renderer whose API matches [TanStack Charts](https://tanstack.com/charts) 0.18.0 exactly, so chart definitions are valid TanStack definitions.

To switch, install the pinned alpha and replace the exports in that file:

```bash
pnpm add @tanstack/charts@0.18.0 @tanstack/vue-charts@0.18.0
```

```ts
// components/ui/chart/chart-backend.ts
export { Chart } from '@tanstack/vue-charts';
export { areaY, defineChart, lineY } from '@tanstack/charts';
export { pie, polar, radialArc } from '@tanstack/charts/polar';
export { scaleLinear } from '@tanstack/charts/scales/linear';
export { scalePoint } from '@tanstack/charts/scales/point';
```

No component code changes. TanStack Charts is in alpha and may break between minor versions, so keep the exact version pinned.
