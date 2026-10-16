---
title: Area Chart
description: A responsive area chart with axes and grid lines whose values rise from the baseline on mount.
---

# Area Chart

A responsive area chart with a y-axis, grid lines and category labels. Values rise from the baseline on mount while the axis stays still.

::demo-area-chart
::

## Usage

```vue
<script setup lang="ts">
  import AreaChart from '~/components/ui/area-chart/AreaChart.vue';
  import type { AreaChartDatum } from '~/components/ui/area-chart/types';

  const revenue: AreaChartDatum[] = [
    { label: 'Jan', value: 18 },
    { label: 'Feb', value: 24 },
    { label: 'Mar', value: 21 },
  ];
</script>

<template>
  <AreaChart :data="revenue" aria-label="Monthly revenue" />
</template>
```

## Props

| Prop           | Type                                 | Default            | Description                          |
| -------------- | ------------------------------------ | ------------------ | ------------------------------------ |
| `data`         | `{ label: string; value: number }[]` | —                  | One point per category               |
| `color`        | `string`                             | `'var(--chart-1)'` | Any CSS color                        |
| `height`       | `number`                             | `240`              | Height in pixels                     |
| `stroke-width` | `number`                             | `2`                | Line width in pixels                 |
| `grid`         | `boolean`                            | `true`             | Horizontal grid lines at the y ticks |
| `axes`         | `boolean`                            | `true`             | Shows the x and y axes               |
| `aria-label`   | `string`                             | `'Area chart'`     | Accessible name of the chart         |

Motion respects `prefers-reduced-motion`: the chart jumps to its final state instead of animating.

## Use TanStack Charts instead

Every chart imports its engine from one file, `components/ui/chart/chart-backend.ts`. The default engine is a small, dependency-free SVG renderer whose API matches [TanStack Charts](https://tanstack.com/charts) 1.x exactly, so chart definitions are valid TanStack definitions.

To switch, install TanStack Charts and replace the exports in that file:

```bash
pnpm add @tanstack/charts@^1.1.0 @tanstack/vue-charts@^1.1.0
```

```ts
// components/ui/chart/chart-backend.ts
export { Chart } from '@tanstack/vue-charts';
export { areaY, defineChart, lineY } from '@tanstack/charts';
export { pie, polar, radialArc } from '@tanstack/charts/polar';
export { scaleLinear } from '@tanstack/charts/scales/linear';
export { scalePoint } from '@tanstack/charts/scales/point';
```

No component code changes. Verified against TanStack Charts 1.1.0, the first stable line with a compatibility promise for its public API.
