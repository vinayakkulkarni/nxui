---
title: Flipping Word Swap
description: A character-by-character word swap that flips the next word into place on hover, focus or tap.
---

# Flipping Word Swap

A word that flips into a second word, one character at a time. The letters of the first word tip back and fade on a top hinge, then the letters of the second word swing up into place from below. Hover it, tab to it or tap it to swap; move away and the flip plays in reverse. Change the words, colors, type and timing in the panel.

::demo-flipping-word-swap
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flipping-word-swap.json"
```

## Usage

```vue
<script setup lang="ts">
  import FlippingWordSwap from '~/components/ui/flipping-word-swap/FlippingWordSwap.vue';
</script>

<template>
  <FlippingWordSwap
    word1="Components"
    word2="Consistency"
    :duration="400"
    :stagger="44"
    class="text-5xl font-bold tracking-tight"
    to-class="text-primary"
  />
</template>
```

The button inherits font, size, weight, line height, letter spacing and color from its parent, so it sits inside a heading or a sentence. Style it with `class` / `style` on the root, or style only the revealed word with `to-class` / `to-style`.

## Props

| Prop       | Type         | Default     | Description                                          |
| ---------- | ------------ | ----------- | ---------------------------------------------------- |
| `word1`    | `string`     | required    | The word or short phrase shown at rest.              |
| `word2`    | `string`     | required    | The word or short phrase revealed on interaction.    |
| `duration` | `number`     | `400`       | Duration of each character flip in ms (minimum 180). |
| `stagger`  | `number`     | `44`        | Delay between neighboring character flips in ms.     |
| `class`    | `string`     | `undefined` | Classes for the interactive button.                  |
| `to-class` | `string`     | `undefined` | Classes applied only to the revealed word.           |
| `to-style` | `StyleValue` | `undefined` | Inline styles applied only to the revealed word.     |

Inline `style` falls through to the root button.

## Accessibility

- The root is a native `<button>` with `aria-pressed` and an `aria-label` that names the visible word. The flipping letters are `aria-hidden`.
- Mouse swaps on hover. Touch and pen toggle on tap. Keyboard swaps on `:focus-visible` and swaps back on blur.
- With reduced motion, the words swap at once with no flip.

- Ported from [componentry.fun](https://componentry.dev/docs/components/flipping-word-swap) by Harsh Jadhav.
