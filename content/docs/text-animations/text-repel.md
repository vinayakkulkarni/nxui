---
title: Text Repel
description: Physics-based text where letters are repelled or attracted by the cursor with spring dynamics.
---

::demo-text-repel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-repel.json"
```

## Usage

```vue
<script setup lang="ts">
  import TextRepel from '~/components/ui/text-repel/TextRepel.vue';
</script>

<template>
  <TextRepel text="Hover Me" class="text-4xl font-bold" />
</template>
```

## Props

| Prop           | Type                   | Default   | Description                                      |
| -------------- | ---------------------- | --------- | ------------------------------------------------ |
| `text`         | `string`               | —         | The text to display                              |
| `radius`       | `number`               | `120`     | Cursor influence radius in pixels                |
| `strength`     | `number`               | `45`      | Maximum displacement strength in pixels          |
| `mode`         | `'repel' \| 'attract'` | `'repel'` | Push letters away or pull them toward the cursor |
| `stiffness`    | `number`               | `180`     | Spring stiffness — higher = snappier return      |
| `damping`      | `number`               | `14`      | Spring damping — lower = bouncier return         |
| `mass`         | `number`               | `0.4`     | Spring mass — higher = heavier feel              |
| `class`        | `string`               | —         | Additional CSS classes for the container         |
| `letter-class` | `string`               | —         | CSS classes applied to each letter               |
