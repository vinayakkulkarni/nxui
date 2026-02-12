---
title: Noise Texture
description: A subtle noise overlay that adds texture and depth to any container.
category: visual-effects
---

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.dev/r/noise-texture.json"
```

## Usage

```vue
<script setup lang="ts">
  import NoiseTexture from '~/components/ui/NoiseTexture.vue';
</script>

<template>
  <NoiseTexture class="h-[300px] rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
    <div class="flex size-full items-center justify-center text-white">
      <p class="text-2xl font-bold">Content with noise overlay</p>
    </div>
  </NoiseTexture>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| opacity | `number` | `0.04` | Opacity of the noise overlay (0-1). |
| class | `string` | - | Additional CSS classes for the container. |
