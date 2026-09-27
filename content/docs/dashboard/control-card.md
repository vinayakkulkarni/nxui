---
title: Control Card
description: A frosted-glass device card with a power switch, a level slider and an accent glow that blooms when on.
---

# Control Card

A frosted-glass card for devices and toggles. Switching it on fills the icon with the accent color, blooms a soft glow behind the card and enables the level slider. Place it over a colorful background for the full glass effect.

::demo-control-card
::

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ControlCard from '~/components/ui/control-card/ControlCard.vue';

  const on = ref(true);
  const brightness = ref(72);
</script>

<template>
  <ControlCard
    v-model:on="on"
    v-model:level="brightness"
    name="Ceiling lights"
    location="Living room"
    icon="lamp-ceiling"
    stat="4 bulbs"
    level-label="Brightness"
    color="oklch(0.8 0.16 80)"
  />
</template>
```

## Props

| Prop            | Type      | Default            | Description                                   |
| --------------- | --------- | ------------------ | --------------------------------------------- |
| `name`          | `string`  | —                  | Device name                                   |
| `location`      | `string`  | `''`               | Where the device is                           |
| `icon`          | `string`  | `'power'`          | Lucide icon name without the prefix           |
| `stat`          | `string`  | `''`               | Reading shown while on                        |
| `level-label`   | `string`  | `''`               | Label for the level slider; hidden when empty |
| `level-unit`    | `string`  | `'%'`              | Unit appended to the level                    |
| `color`         | `string`  | `'var(--chart-4)'` | Accent color while on                         |
| `v-model:on`    | `boolean` | `false`            | Power state                                   |
| `v-model:level` | `number`  | `60`               | Slider value from 0 to 100                    |

Motion respects `prefers-reduced-motion`.
