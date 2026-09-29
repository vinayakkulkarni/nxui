---
title: Button Evolution
description: One button restyled across 40 years of desktop UI — scrub a timeline from 1986 to 2026 and watch the year roll over.
---

::demo-button-evolution
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/button-evolution.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ButtonEvolution from '~/components/ui/button-evolution/ButtonEvolution.vue';

  const year = ref(2004);
</script>

<template>
  <ButtonEvolution v-model="year" sound />
</template>
```

Drag across the timeline, click a year, or focus the timeline and use the arrow keys, Home and End. The ticks rise in a bell curve around the pointer, the button crossfades into the nearest era's style, and each digit of the year rolls into place. On release, the timeline springs to the nearest year.

## Props

| Prop      | Type      | Default | Description                                         |
| --------- | --------- | ------- | --------------------------------------------------- |
| `v-model` | `number`  | `1986`  | Selected year; one of the timeline years            |
| `sound`   | `boolean` | `false` | Plays a short synthesized click on each year change |

## Events

| Event   | Payload        | Description                          |
| ------- | -------------- | ------------------------------------ |
| `click` | `year: number` | The button was clicked in that style |

The timeline years are 1986, 1988, 1990, 1994, 2000, 2002, 2004, 2007, 2010, 2011, 2012, 2018, 2022, 2023 and 2026. Styles use CSS only — pixel-stepped outlines, glossy gradients and flat fills. With `prefers-reduced-motion`, styles and digits switch without animating.
