---
title: Text Morph
description: A fluid text primitive that blends one value into the next while keeping its visual center and inheriting the surrounding typography.
---

Words, numbers or prices melt into one another on a timer. Each value rests for `interval` ms, then a blur plus an SVG alpha-threshold filter fuses the outgoing and incoming text into one liquid shape while the box eases to the new width. Font, size, weight and color come from the parent, so it drops into any heading.

::demo-text-morph
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-morph.json"
```

## Usage

```vue
<script setup lang="ts">
  import TextMorph from '~/components/ui/text-morph/TextMorph.vue';
</script>

<template>
  <h2 class="text-center text-4xl font-bold tracking-tight md:text-5xl">
    <TextMorph
      :words="['IMAGINE', 'REFINE', 'RELEASE']"
      :interval="2600"
      :morph-duration="680"
    />
  </h2>
</template>
```

## Props

| Prop             | Type       | Default                            | Description                                                          |
| ---------------- | ---------- | ---------------------------------- | -------------------------------------------------------------------- |
| `words`          | `string[]` | `['IMAGINE', 'REFINE', 'RELEASE']` | Text, numbers, prices or short phrases shown by the morph sequence.  |
| `interval`       | `number`   | `2600`                             | Time each value rests before the next morph begins, in ms (min 400). |
| `morph-duration` | `number`   | `680`                              | Duration of the fluid morph, in ms (min 240).                        |
| `class`          | `string`   | —                                  | Extra classes for layout or typography. Text styles inherit.         |

Empty entries in `words` are dropped. With fewer than two values the text stays still.

## Accessibility

- The root carries `aria-label` set to the current value; the animated layers are `aria-hidden`.
- `aria-live="off"` keeps screen readers from announcing every change.
- With `prefers-reduced-motion: reduce` the blur and threshold filter are skipped and values cross-fade in 140 ms with no width animation.

- Ported from [componentry.fun](https://componentry.dev/docs/components/text-morph) by Harsh Jadhav.
