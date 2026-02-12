---
title: Pulsating Button
description: A button with a pulsing ring animation effect that draws attention.
category: buttons
---

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.dev/r/pulsating-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import PulsatingButton from '~/components/ui/PulsatingButton.vue';
</script>

<template>
  <PulsatingButton>Click Me</PulsatingButton>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| pulseColor | `string` | `'#0096ff'` | Color of the pulsing ring. |
| duration | `string` | `'1.5s'` | Animation cycle duration. |
| class | `string` | - | Additional CSS classes. |
