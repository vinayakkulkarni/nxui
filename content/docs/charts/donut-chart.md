---
title: Donut Chart
description: A donut chart that sweeps in clockwise, with a counting total in the center and a legend that lifts its slice on hover.
---

# Donut Chart

A donut chart that sweeps in clockwise from 12 o'clock while the total in the center counts up. Hovering or focusing a legend item lifts its slice and dims the rest.

::demo-donut-chart
::

## Usage

```vue
<script setup lang="ts">
  import DonutChart from '~/components/ui/donut-chart/DonutChart.vue';
  import type { DonutChartDatum } from '~/components/ui/donut-chart/types';

  const traffic: DonutChartDatum[] = [
    { label: 'Direct', value: 4312 },
    { label: 'Search', value: 3120 },
    { label: 'Social', value: 1894 },
  ];
</script>

<template>
  <DonutChart
    :data="traffic"
    center-label="Visits"
    aria-label="Visits by source"
  />
</template>
```

## Props

| Prop            | Type                                                 | Default         | Description                                                  |
| --------------- | ---------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| `data`          | `{ label: string; value: number; color?: string }[]` | —               | Slices in drawing order; colors default to the chart palette |
| `size`          | `number`                                             | `220`           | Diameter in pixels                                           |
| `thickness`     | `number`                                             | `28`            | Ring thickness in pixels                                     |
| `gap`           | `number`                                             | `0.03`          | Empty angle between slices, in radians                       |
| `corner-radius` | `number`                                             | `4`             | Slice corner radius in pixels                                |
| `center-label`  | `string`                                             | `'Total'`       | Caption under the total                                      |
| `legend`        | `boolean`                                            | `true`          | Shows the interactive legend                                 |
| `aria-label`    | `string`                                             | `'Donut chart'` | Accessible name of the chart                                 |

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
