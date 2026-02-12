---
title: Shimmer Button
description: A button with a rotating shimmer/glow effect.
category: buttons
---

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.dev/r/shimmer-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import ShimmerButton from '~/components/ui/ShimmerButton.vue';
</script>

<template>
  <ShimmerButton>Shimmer</ShimmerButton>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| shimmerColor | `string` | `'#ffffff'` | Color of the shimmer effect. |
| shimmerSize | `string` | `'0.05em'` | Size of the shimmer border. |
| shimmerDuration | `string` | `'3s'` | Duration of the shimmer animation cycle. |
| background | `string` | `'rgba(0, 0, 0, 1)'` | Background color of the button. |
| class | `string` | - | Additional CSS classes. |
