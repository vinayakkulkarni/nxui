---
title: Pulsating Button
description: Vue port of the pulsating-button component from componentry.fun.
---

::demo-pulsating-button
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pulsating-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import PulsatingButton from '~/components/ui/pulsating-button/PulsatingButton.vue';
</script>

<template>
  <PulsatingButton>Click Me</PulsatingButton>
</template>
```

## Props

| Prop          | Type     | Default     | Description                        |
| ------------- | -------- | ----------- | ---------------------------------- |
| `pulse-color` | `string` | `'#0096ff'` | Color of the pulse ring animation  |
| `duration`    | `string` | `'1.5s'`    | Duration of one pulse cycle        |
| `class`       | `string` | `''`        | Additional CSS classes for styling |
