---
title: Border Beam
description: A moving gradient beam that travels along the border of its container. Perfect for highlighting active states.
---

::demo-border-beam
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/border-beam.json"
```

## Usage

```vue
<script setup lang="ts">
  import BorderBeam from '~/components/ui/border-beam/BorderBeam.vue';
</script>

<template>
  <div class="relative rounded-xl border p-8">
    <p>Content with border beam effect</p>
    <BorderBeam />
  </div>
</template>
```

## Props

| Prop           | Type     | Default     | Description                        |
| -------------- | -------- | ----------- | ---------------------------------- |
| `size`         | `number` | `200`       | Length of the beam in pixels       |
| `duration`     | `number` | `15`        | Animation duration in seconds      |
| `border-width` | `number` | `1.5`       | Width of the border/beam in pixels |
| `color-from`   | `string` | `'#ffaa40'` | Start color of the gradient        |
| `color-to`     | `string` | `'#9c40ff'` | End color of the gradient          |
| `delay`        | `number` | `0`         | Animation delay in seconds         |
