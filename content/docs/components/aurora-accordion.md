---
title: Aurora Accordion
description: Accordion whose opened row detaches into its own card while an aurora gradient blooms behind the answer, then settles into a calm glow.
---

::demo-aurora-accordion
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/aurora-accordion.json"
```

## Usage

```vue
<script setup lang="ts">
  import AuroraAccordion from '~/components/ui/aurora-accordion/AuroraAccordion.vue';

  const items = [
    {
      title: 'What does Blissful Studio do?',
      content: 'We are a design studio crafting brands and websites.',
      icon: 'lucide:sparkles',
    },
    {
      title: 'What services do you offer?',
      content: 'Brand identity, marketing sites, and product design.',
      icon: 'lucide:pen-tool',
    },
  ];
</script>

<template>
  <AuroraAccordion :items="items" />
</template>
```

Opening a row splits it out of the list into its own card (layout-animated
with springs), the `+` rotates into a `×`, and an aurora gradient blooms
behind the answer before settling to a soft glow. Colors work over both
light and dark backgrounds — pass your own `aurora-colors` to re-tint.

## Props

| Prop             | Type                    | Default                             | Description                                |
| ---------------- | ----------------------- | ----------------------------------- | ------------------------------------------ |
| `items`          | `AuroraAccordionItem[]` | —                                   | Rows (`title`, `content`, optional `icon`) |
| `aurora-colors`  | `string[]`              | `['#2563eb', '#9333ea', '#ea580c']` | Aurora blend colors                        |
| `bloom-duration` | `number`                | `1400`                              | Bloom flare duration in ms before settling |

## Events

| Event    | Payload          | Description                                    |
| -------- | ---------------- | ---------------------------------------------- |
| `change` | `number \| null` | Fired with the opened index (null when closed) |
