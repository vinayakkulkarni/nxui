---
title: Iso Stacked Bars
description: An isometric 3D stacked bar chart with two rows of textured boxes on a floor plate, a hover tooltip and a legend that highlights one series.
---

# Iso Stacked Bars

A stacked bar chart drawn in isometric 3D. Each category has a tall bar in the back row and a short bar in the front row, so output and losses sit side by side on one floor plate. Each box shades its top, left and right faces from the series color and adds a fine texture. Hover a segment to see its value, or hover a legend item to highlight that series in every bar. The bars grow up from the floor when the chart scrolls into view.

::demo-iso-stacked-bars
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/iso-stacked-bars.json"
```

## Usage

```vue
<script setup lang="ts">
  import IsoStackedBars from '~/components/ui/iso-stacked-bars/IsoStackedBars.vue';
  import type {
    IsoStackedBarsDatum,
    IsoStackedBarsSeries,
  } from '~/components/ui/iso-stacked-bars/types';

  const series: IsoStackedBarsSeries[] = [
    { key: 'housing', label: 'Housing', color: '#3ee0d8', row: 'back' },
    { key: 'bracket', label: 'Bracket', color: '#f5d03b', row: 'back' },
    { key: 'rework', label: 'Rework', color: '#f590b4', row: 'front' },
    { key: 'scrap', label: 'Scrap', color: '#f2742b', row: 'front' },
  ];

  const data: IsoStackedBarsDatum[] = [
    {
      label: 'Sep 22',
      values: { housing: 590, bracket: 2520, rework: 184, scrap: 46 },
    },
    {
      label: 'Sep 23',
      values: { housing: 600, bracket: 2490, rework: 46, scrap: 118 },
    },
  ];
</script>

<template>
  <IsoStackedBars
    title="Output & Scrap"
    subtitle="units per day · by product"
    note="scrap 2.4 %"
    :series="series"
    :data="data"
  />
</template>
```

Series stack in the order you give them, bottom first. Each row has its own scale: the tallest back bar fills the full height, and the tallest front bar fills `front-scale` of it.

## Props

| Prop          | Type                     | Default   | Description                                                       |
| ------------- | ------------------------ | --------- | ----------------------------------------------------------------- |
| `series`      | `IsoStackedBarsSeries[]` | —         | Series in stacking order. See the series options below.           |
| `data`        | `IsoStackedBarsDatum[]`  | —         | One entry per category: `{ label, values: { [seriesKey]: n } }`.  |
| `title`       | `string`                 | `''`      | Card title.                                                       |
| `subtitle`    | `string`                 | `''`      | Muted line under the title.                                       |
| `total`       | `number`                 | —         | Headline number. Defaults to the sum of all back-row values.      |
| `unit`        | `string`                 | `'units'` | Unit after the headline. Also used for back-row totals.           |
| `note`        | `string`                 | `''`      | Orange accent text on the right of the headline.                  |
| `front-scale` | `number`                 | `0.5`     | Height of the tallest front bar relative to the tallest back bar. |
| `animate`     | `boolean`                | `true`    | Grow the bars from the floor when the chart comes into view.      |
| `aria-label`  | `string`                 | title     | Accessible name of the chart.                                     |
| `class`       | `string`                 | `''`      | Extra classes for the root element.                               |

## Series options

| Option    | Type                                      | Description                                         |
| --------- | ----------------------------------------- | --------------------------------------------------- |
| `key`     | `string`                                  | Field in each datum's `values`.                     |
| `label`   | `string`                                  | Legend and tooltip label.                           |
| `color`   | `string`                                  | Any CSS color. The faces are shaded from it.        |
| `row`     | `'back' \| 'front'`                       | Row the series stacks in.                           |
| `texture` | `'stripes' \| 'dots' \| 'grid' \| 'none'` | Fine texture on the faces. Defaults to `'stripes'`. |

## Accessibility

- Every bar is focusable and has an `aria-label` with its category and all its segment values.
- The bars use a roving tab stop. Left and Right move between categories, Up and Down switch rows, and Home and End jump to the ends.
- A focused bar shows its total in the tooltip, which is announced through `aria-live`.
- Legend items are buttons. Hover or focus one to highlight its series; click to pin the highlight (`aria-pressed`).
- With reduced motion the bars render at full height without the grow animation.
