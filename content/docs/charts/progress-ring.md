---
title: Progress Ring
description: A circular progress indicator with rounded ends and a percentage that counts up with the ring.
---

# Progress Ring

A circular progress indicator. The ring fills clockwise from 12 o'clock with a rounded end while the percentage counts up alongside it. The default slot replaces the center content.

::demo-progress-ring
::

## Usage

```vue
<script setup lang="ts">
  import ProgressRing from '~/components/ui/progress-ring/ProgressRing.vue';
</script>

<template>
  <ProgressRing :value="72" label="Storage" color="var(--chart-1)" />
</template>
```

## Props

| Prop          | Type     | Default            | Description                     |
| ------------- | -------- | ------------------ | ------------------------------- |
| `value`       | `number` | —                  | Progress from 0 to 100          |
| `size`        | `number` | `120`              | Diameter in pixels              |
| `thickness`   | `number` | `10`               | Ring thickness in pixels        |
| `color`       | `string` | `'var(--chart-1)'` | Any CSS color                   |
| `track-color` | `string` | `'var(--muted)'`   | Color of the unfilled track     |
| `label`       | `string` | `''`               | Caption under the percentage    |
| `aria-label`  | `string` | derived            | Defaults to the label and value |

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
