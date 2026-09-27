---
title: Sparkline
description: A compact trend line with a shaded area that rises into place, sized for KPI cards and table cells.
---

# Sparkline

A compact trend line for KPI cards, table rows and dashboards. The line and its shaded area rise from the baseline on mount, and the chart fills the width of its container.

::demo-sparkline
::

## Usage

```vue
<script setup lang="ts">
  import Sparkline from '~/components/ui/sparkline/Sparkline.vue';
</script>

<template>
  <Sparkline
    :data="[12, 18, 15, 22, 19, 27, 24, 31]"
    color="var(--chart-2)"
    aria-label="Revenue, last 8 months"
  />
</template>
```

## Props

| Prop           | Type       | Default            | Description                    |
| -------------- | ---------- | ------------------ | ------------------------------ |
| `data`         | `number[]` | —                  | Series values in order         |
| `color`        | `string`   | `'var(--chart-1)'` | Any CSS color                  |
| `height`       | `number`   | `48`               | Height in pixels               |
| `stroke-width` | `number`   | `2`                | Line width in pixels           |
| `fill`         | `boolean`  | `true`             | Shades the area under the line |
| `aria-label`   | `string`   | `'Trend'`          | Accessible name of the chart   |

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
