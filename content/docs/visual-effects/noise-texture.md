---
title: Noise Texture
description: A subtle noise overlay that adds texture and depth to any container.
---

::demo-noise-texture
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/noise-texture.json"
```

## Usage

```vue
<script setup lang="ts">
  import NoiseTexture from '~/components/ui/noise-texture/NoiseTexture.vue';
</script>

<template>
  <NoiseTexture class="h-75 w-full bg-linear-to-br from-violet-500 to-pink-500">
    <p class="text-3xl font-bold text-white">Noise Texture</p>
  </NoiseTexture>
</template>
```

## Props

| Prop      | Type     | Default | Description                              |
| --------- | -------- | ------- | ---------------------------------------- |
| `opacity` | `number` | `0.04`  | Opacity of the noise overlay (0-1)       |
| `class`   | `string` | —       | Additional CSS classes for the container |
