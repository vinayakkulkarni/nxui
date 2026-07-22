---
title: Circle Input
description: A segmented character input rendered as a row of circular cells that auto-types words, collapses to a single circle, and spreads back out.
---

::demo-circle-input
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/circle-input.json"
```

## Usage

```vue
<script setup lang="ts">
  import CircleInput from '~/components/ui/circle-input/CircleInput.vue';
</script>

<template>
  <CircleInput :words="['HELLO', 'WORLD']" :length="5" />
</template>
```

With `words` set and `autoplay` on (default), the field types each word one
letter per circle, holds, then collapses the row into a single center circle
and spreads back out to loop. Focus the field to take over with real keyboard
input — autoplay pauses while focused and resumes on blur. Use `v-model` to
read or drive the value directly:

```vue
<template>
  <CircleInput v-model="code" :words="[]" :length="6" :autoplay="false" />
</template>
```

## Props

| Prop            | Type       | Default              | Description                                              |
| --------------- | ---------- | -------------------- | -------------------------------------------------------- |
| `length`        | `number`   | `5`                  | Number of character cells                                |
| `model-value`   | `string`   | `''`                 | Two-way bound value (uppercased, clamped to `length`)    |
| `words`         | `string[]` | `['HELLO', 'WORLD']` | Words the autoplay loop types. Empty disables autoplay   |
| `autoplay`      | `boolean`  | `true`               | Auto-type the `words` in a loop                          |
| `type-speed`    | `number`   | `260`                | Per-character type delay, in ms                          |
| `hold-duration` | `number`   | `1100`               | How long a completed word rests before collapsing, in ms |
| `accent`        | `string`   | `'#22d3ee'`          | Accent color for the active ring + caret                 |
| `size`          | `number`   | `72`                 | Diameter of each circular cell, in px                    |
| `gap`           | `number`   | `20`                 | Gap between cells, in px                                 |

## Events

| Event               | Payload         | Description                                 |
| ------------------- | --------------- | ------------------------------------------- |
| `update:modelValue` | `value: string` | Fired as the value changes (v-model)        |
| `complete`          | `word: string`  | Fired when an autoplay word finishes typing |

## Credits

Inspired by the circular typing interaction by [@hours](https://x.com/hours).
