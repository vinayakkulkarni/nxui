---
title: True Focus
description: Blurs every word but one and marks the focused word with corner brackets, a box, an underline or a soft highlight that glides from word to word.
---

A sentence where one word at a time is sharp and the rest are blurred. A frame moves to the focused word on a timer: corner brackets, a box, an underline or a soft marker highlight. The focused word can grow slightly, the frame can spring between words, and the order can be random. Turn on hover mode to move the focus with the cursor instead. Try the presets in the panel.

::demo-true-focus
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/true-focus.json"
```

## Usage

```vue
<script setup lang="ts">
  import TrueFocus from '~/components/ui/true-focus/TrueFocus.vue';
</script>

<template>
  <TrueFocus
    sentence="True Focus"
    border-color="#5227FF"
    :blur-amount="5"
    :animation-duration="0.5"
    :pause-between-animations="1"
  />

  <TrueFocus
    sentence="Make every word count"
    focus-style="underline"
    border-color="#ff5a36"
    easing="spring"
    order="random"
    :blur-amount="0"
    :unfocused-opacity="0.28"
    :border-width="4"
  />
</template>
```

## Examples

### Manual Hover Mode

Focus follows mouse hover instead of auto-cycling.

::demo-true-focus-hover
::

## Props

| Prop                       | Type                                                | Default         | Description                                                           |
| -------------------------- | --------------------------------------------------- | --------------- | --------------------------------------------------------------------- |
| `sentence`                 | `string`                                            | `'True Focus'`  | The text to display                                                   |
| `separator`                | `string`                                            | `' '`           | String used to split the sentence into words                          |
| `manual-mode`              | `boolean`                                           | `false`         | Focus follows the hovered word instead of cycling on its own          |
| `focus-style`              | `'brackets' \| 'box' \| 'underline' \| 'highlight'` | `'brackets'`    | How the focused word is marked                                        |
| `order`                    | `'sequential' \| 'random'`                          | `'sequential'`  | Visit words in order or jump to a random other word                   |
| `easing`                   | `'smooth' \| 'spring'`                              | `'smooth'`      | Smooth glide or a springy overshoot between words                     |
| `blur-amount`              | `number`                                            | `5`             | Blur (px) of the words out of focus                                   |
| `focus-scale`              | `number`                                            | `1`             | Size the focused word grows to. 1 keeps it the same                   |
| `unfocused-opacity`        | `number`                                            | `1`             | Opacity of the words out of focus                                     |
| `border-color`             | `string`                                            | `'green'`       | Color of the brackets, box or underline                               |
| `highlight-color`          | `string`                                            | —               | Fill of the `highlight` style (30% mix). Falls back to `border-color` |
| `glow-color`               | `string`                                            | `'transparent'` | Drop-shadow glow around the frame                                     |
| `animation-duration`       | `number`                                            | `0.5`           | Seconds the focus takes to move                                       |
| `pause-between-animations` | `number`                                            | `1`             | Seconds the focus rests on each word                                  |
| `corner-size`              | `number`                                            | `16`            | Length of each corner bracket (px)                                    |
| `border-width`             | `number`                                            | `3`             | Thickness of the brackets, box or underline (px)                      |
| `class`                    | `string`                                            | `''`            | Extra classes on the root                                             |

## Accessibility

- The words are plain text in reading order, so screen readers read the sentence normally; the frame is `aria-hidden`.
- With `prefers-reduced-motion: reduce` the focus still moves, but jumps without a transition.
- Hover mode needs a pointer. On touch screens leave `manual-mode` off so the focus cycles by itself.

- Ported from [React Bits](https://reactbits.dev/text-animations/true-focus) by David Haz.
