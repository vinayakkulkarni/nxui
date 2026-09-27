---
title: KPI Carousel
description: A carousel of best, worst and neutral headline metrics with tone badges, dots, arrows and keyboard support.
---

# KPI Carousel

A carousel for headline metrics, each tagged as best, worst or neutral with a matching badge and glow. It autoplays and pauses while the pointer or keyboard focus is inside. Arrow keys move between slides.

::demo-kpi-carousel
::

## Usage

```vue
<script setup lang="ts">
  import KpiCarousel from '~/components/ui/kpi-carousel/KpiCarousel.vue';
  import type { KpiCarouselItem } from '~/components/ui/kpi-carousel/types';

  const items: KpiCarouselItem[] = [
    {
      title: 'Top region',
      value: '$184.3k',
      caption: 'North America grew 18%.',
      tone: 'best',
    },
    {
      title: 'Lowest conversion',
      value: '1.2%',
      caption: 'Mobile checkout dropped.',
      tone: 'worst',
    },
  ];
</script>

<template>
  <KpiCarousel :items="items" />
</template>
```

## Props

| Prop         | Type                                                                                        | Default         | Description                                 |
| ------------ | ------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------- |
| `items`      | `{ title: string; value: string; caption: string; tone: 'best' \| 'worst' \| 'neutral' }[]` | —               | Slides in order                             |
| `v-model`    | `number`                                                                                    | `0`             | Index of the active slide                   |
| `interval`   | `number`                                                                                    | `5000`          | Autoplay delay in ms; `0` disables autoplay |
| `aria-label` | `string`                                                                                    | `'Key metrics'` | Accessible name of the carousel             |

Motion respects `prefers-reduced-motion`.
