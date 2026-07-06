---
title: Animated TOC
description: Table of contents with an SVG rail that snakes through nesting levels and a dot that glides along the curve to the active entry.
---

::demo-animated-toc
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/animated-toc.json"
```

## Usage

```vue
<script setup lang="ts">
  import AnimatedToc from '~/components/ui/animated-toc/AnimatedToc.vue';

  const items = [
    { label: 'Introduction', depth: 0, href: '#introduction' },
    { label: 'Core Concepts', depth: 0, href: '#core-concepts' },
    { label: 'Architecture', depth: 1, href: '#architecture' },
    { label: 'Components', depth: 0, href: '#components' },
  ];
</script>

<template>
  <AnimatedToc v-model="activeIndex" :items="items" />
</template>
```

The rail is a single SVG path with rounded S-bends wherever the nesting
depth changes. Clicking an entry spring-glides the dot along the curve
(measured via `getPointAtLength`), while a second stroke darkens the
traveled portion of the path. `v-model` tracks the active index — drive it
from an `IntersectionObserver` to sync with real page headings.

## Props

| Prop         | Type                | Default          | Description                        |
| ------------ | ------------------- | ---------------- | ---------------------------------- |
| `items`      | `AnimatedTocItem[]` | —                | Entries (`label`, `depth`, `href`) |
| `v-model`    | `number`            | `0`              | Active entry index                 |
| `row-height` | `number`            | `48`             | Row height in px                   |
| `indent`     | `number`            | `24`             | Indent per depth level in px       |
| `title`      | `string`            | `'On this page'` | Heading (empty string hides it)    |

## Events

| Event    | Payload  | Description               |
| -------- | -------- | ------------------------- |
| `select` | `number` | Fired on entry activation |
