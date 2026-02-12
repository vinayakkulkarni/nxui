---
title: Text Animate
description: A premium text animation component with multiple presets including blur, fade, slide, and scale effects.
category: text-animations
---

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.dev/r/text-animate.json"
```

## Usage

```vue
<script setup lang="ts">
  import TextAnimate from '~/components/ui/TextAnimate.vue';
</script>

<template>
  <TextAnimate animation="blurInUp" by="character" text="Blur In Up" />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| text | `string` | - | The text content to animate. |
| animation | `AnimationType` | `'fadeIn'` | fadeIn, blurIn, blurInUp, blurInDown, slideUp, slideDown, slideLeft, slideRight, scaleUp, scaleDown |
| by | `'text' \| 'word' \| 'character'` | `'word'` | How to split the text. |
| startOnView | `boolean` | `true` | Whether to start animation when element enters viewport. |
| once | `boolean` | `true` | Whether to run animation only once. |
| duration | `number` | `0.3` | Duration of the animation per segment in seconds. |
| delay | `number` | `0` | Delay before starting the animation in seconds. |
