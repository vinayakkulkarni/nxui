---
title: Numbered Reveal
description: A scroll-driven editorial list — numbered sections rise into view with staggered easing, one after another.
---

# Numbered Reveal

An editorial list of numbered sections (`01.`, `02.`, `03.`) that reveal on scroll: each heading and body paragraph rises with a staggered ease as the block enters the viewport. Built for long-form product pages and manifestos.

## Usage

```vue
<script setup lang="ts">
  import NumberedReveal from '~/components/ui/numbered-reveal/NumberedReveal.vue';
</script>

<template>
  <NumberedReveal class="h-120" />
</template>
```

## Props

| Prop       | Type              | Default    | Description                             |
| ---------- | ----------------- | ---------- | --------------------------------------- |
| `sections` | `RevealSection[]` | 3 defaults | `{ number, title, body }[]`             |
| `stagger`  | `boolean`         | `true`     | Reveal sections one at a time on scroll |
| `class`    | `string`          | `''`       | Additional classes                      |
