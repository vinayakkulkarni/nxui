---
title: Hyper Text
description: A text component that scrambles letters before revealing the final text on hover or load.
---

::demo-hyper-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/hyper-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import HyperText from '~/components/ui/hyper-text/HyperText.vue';
</script>

<template>
  <HyperText text="Hyper Text" class="text-4xl font-bold" />
</template>
```

## Props

| Prop              | Type      | Default | Description                                           |
| ----------------- | --------- | ------- | ----------------------------------------------------- |
| `text`            | `string`  | —       | The text content to be animated                       |
| `duration`        | `number`  | `800`   | Total animation duration in milliseconds              |
| `animate-on-load` | `boolean` | `true`  | Whether to start the animation automatically on mount |
| `class`           | `string`  | —       | Additional CSS classes for styling                    |
