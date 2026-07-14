---
title: Bouncy Accordion
description: Accordion with a playful spring bounce — the open row detaches from its neighbors with animated corner radii and a gap that springs apart.
---

::demo-bouncy-accordion
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/bouncy-accordion.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import BouncyAccordion from '~/components/ui/bouncy-accordion/BouncyAccordion.vue';

  const active = ref<string | null>(null);

  const items = [
    {
      id: 'shipping',
      title: 'How fast is shipping?',
      description: 'Orders placed before noon ship the same day.',
      icon: 'lucide:truck',
    },
    {
      id: 'returns',
      title: 'What is the return policy?',
      description: 'Everything can come back within 30 days.',
      icon: 'lucide:rotate-ccw',
    },
  ];
</script>

<template>
  <BouncyAccordion v-model="active" :items="items" />
</template>
```

Rows sit flush in a single card. Opening one springs it apart from its
neighbors — the gap bounces open, corner radii animate so each connected
group stays visually sealed, and the description spring-expands while the
chevron flips. Respects `prefers-reduced-motion`.

## Props

| Prop          | Type                    | Default | Description                                                |
| ------------- | ----------------------- | ------- | ---------------------------------------------------------- |
| `items`       | `BouncyAccordionItem[]` | —       | Rows (`id`, `title`, `description?`, `icon?`, `disabled?`) |
| `collapsible` | `boolean`               | `true`  | Clicking the open row closes it                            |
| `class`       | `string`                | `''`    | Extra classes on the root                                  |

## v-model

| Model        | Type             | Description                       |
| ------------ | ---------------- | --------------------------------- |
| `modelValue` | `string \| null` | Open row id (`null` = all closed) |

## Credits

- Ported from [componentry.fun](https://www.componentry.dev/docs/components/bouncy-accordion)
