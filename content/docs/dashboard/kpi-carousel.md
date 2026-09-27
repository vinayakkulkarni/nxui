---
title: KPI Carousel
description: A titled panel of best, worst and neutral metric cards with tone tints, arrows, dots and peeking neighbours.
---

# KPI Carousel

A titled panel that pages through metric cards. Each card is tinted by its tone — green for best, red for worst, blue for neutral — with the value and change on the right. The neighbouring cards peek in at the edges, and the arrows, dots and arrow keys move between them. Stack several panels for a top/bottom/neutral summary.

::demo-kpi-carousel
::

## Usage

```vue
<script setup lang="ts">
  import KpiCarousel from '~/components/ui/kpi-carousel/KpiCarousel.vue';
  import type { KpiCarouselItem } from '~/components/ui/kpi-carousel/types';

  const items: KpiCarouselItem[] = [
    {
      title: 'Best Contributor',
      caption: 'Most significant contributor',
      value: 'TCS',
      delta: 4.2,
      tone: 'best',
    },
    {
      title: 'Worst Contributor',
      caption: 'Most significant contributor',
      value: 'RELNC',
      delta: 0.26,
      tone: 'worst',
    },
    {
      title: 'Neutral Contributor',
      caption: 'Most neutral contributor',
      value: '45.52',
      tone: 'neutral',
    },
  ];
</script>

<template>
  <KpiCarousel title="Active Top Names" :items="items" />
</template>
```

## Props

| Prop       | Type                                        | Default | Description                                                                  |
| ---------- | ------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| `title`    | `string`                                    | —       | Panel heading                                                                |
| `items`    | `{ title; caption; value; delta?; tone }[]` | —       | `tone` is `'best'`, `'worst'` or `'neutral'`; omit `delta` for a large value |
| `v-model`  | `number`                                    | `0`     | Index of the active card                                                     |
| `interval` | `number`                                    | `0`     | Autoplay delay in ms; `0` disables autoplay                                  |

Motion respects `prefers-reduced-motion`.
