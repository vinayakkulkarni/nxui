---
title: Control Card
description: A frosted-glass device card with a round power button, a device name and a boxed stat, made to sit over a photo.
---

# Control Card

A frosted-glass card for smart-home and device dashboards. The round power button fills with the accent color when on. The card blurs whatever is behind it, so place it over a photo or a colorful background.

::demo-control-card
::

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ControlCard from '~/components/ui/control-card/ControlCard.vue';

  const on = ref(true);
</script>

<template>
  <ControlCard
    v-model:on="on"
    category="Wi-Fi"
    name="Starlink Internet"
    icon="wifi"
    :stat="{ icon: 'gauge', value: 'Speed ~ 1GB', label: 'Active' }"
  />
</template>
```

## Props

| Prop         | Type                                             | Default                  | Description                         |
| ------------ | ------------------------------------------------ | ------------------------ | ----------------------------------- |
| `category`   | `string`                                         | —                        | Device type                         |
| `name`       | `string`                                         | —                        | Device name                         |
| `icon`       | `string`                                         | —                        | Lucide icon name without the prefix |
| `stat`       | `{ icon: string; value: string; label: string }` | —                        | Reading shown in the boxed row      |
| `color`      | `string`                                         | `'oklch(0.55 0.22 264)'` | Power button color while on         |
| `v-model:on` | `boolean`                                        | `false`                  | Power state                         |

The text is white by design, so the card needs a darker or busy backdrop to stay legible.

Motion respects `prefers-reduced-motion`.
