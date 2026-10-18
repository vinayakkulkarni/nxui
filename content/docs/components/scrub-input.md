---
title: Scrub Input
description: An inline slider input styled as a pill, perfect for adjusting variables smoothly.
---

::demo-scrub-input
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scrub-input.json"
```

## Usage

```vue
<script setup lang="ts">
  import ScrubInput from '~/components/ui/scrub-input/ScrubInput.vue';
</script>

<template>
  <ScrubInput label="Opacity" :default-value="75" :min="0" :max="100" />
</template>
```

## Props

| Prop            | Type     | Default | Description                 |
| --------------- | -------- | ------- | --------------------------- |
| `model-value`   | `number` | —       | Controlled value (v-model)  |
| `default-value` | `number` | `0`     | Initial uncontrolled value  |
| `label`         | `string` | —       | Label text shown on the bar |
| `min`           | `number` | `0`     | Minimum value               |
| `max`           | `number` | `100`   | Maximum value               |
| `step`          | `number` | `1`     | Step increment              |
| `class`         | `string` | `''`    | Additional CSS classes      |

## Events

| Event                | Payload  | Description                    |
| -------------------- | -------- | ------------------------------ |
| `update:model-value` | `number` | Emitted when the value changes |
