---
title: Split Flap Text
description: Mechanical split-flap departure board that clacks through to each new phrase.
---

# Split Flap Text

A departure board made of flap tiles. Each changed tile flips through a run of random glyphs, one flap at a time, before it lands on the next phrase. The cascade can start from the left, the right, the middle or in a random order. Use the panel to try the board, airport, minimal and clock presets.

::demo-split-flap-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/split-flap-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import SplitFlapText from '~/components/ui/split-flap-text/SplitFlapText.vue';
</script>

<template>
  <SplitFlapText
    :words="['BOARDING NOW', 'FINAL CALL', 'GATE OPEN']"
    charset="alpha"
    tile-color="#0a0a0a"
    text-color="#facc15"
    :flip-duration="0.09"
    :stagger="0.035"
    :flips-per-char="12"
    order="random"
    :glare="0.75"
    :depth="0.85"
  />
</template>
```

## Props

| Prop             | Type                                               | Default                                          | Description                                                                                 |
| ---------------- | -------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `words`          | `string[]`                                         | `['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE']` | Phrases to cycle through like a departure board.                                            |
| `text`           | `string`                                           | `undefined`                                      | Optional single phrase. It takes precedence over `words`, and changing it flips the board.  |
| `flip-duration`  | `number`                                           | `0.12`                                           | Duration, in seconds, of each flap turn.                                                    |
| `stagger`        | `number`                                           | `0.06`                                           | Delay, in seconds, between each tile starting its cascade.                                  |
| `cycle-delay`    | `number`                                           | `2400`                                           | Hold time, in milliseconds, before the next phrase.                                         |
| `charset`        | `'alpha' \| 'alphanumeric' \| 'numeric' \| string` | `'alphanumeric'`                                 | Characters used for the intermediate flip glyphs.                                           |
| `flips-per-char` | `number`                                           | `8`                                              | Number of intermediate glyphs each changed tile flips through.                              |
| `align`          | `'left' \| 'center' \| 'right'`                    | `'left'`                                         | Where phrases shorter than the board sit on it.                                             |
| `tile-color`     | `string`                                           | `'#111827'`                                      | Base color of each tile.                                                                    |
| `text-color`     | `string`                                           | `'#f8fafc'`                                      | Glyph color. `currentColor` follows the surrounding text, useful for the minimal style.     |
| `tile-radius`    | `number \| string`                                 | `8`                                              | Corner radius of each tile. Numbers are pixels.                                             |
| `gap`            | `number \| string`                                 | `6`                                              | Space between tiles. Numbers are pixels.                                                    |
| `font-size`      | `number \| string`                                 | `52`                                             | Tile type size. Numbers are pixels.                                                         |
| `loop`           | `boolean`                                          | `true`                                           | Repeat the phrase list after the last phrase.                                               |
| `pad-to`         | `number`                                           | `12`                                             | Fixed tile count that keeps the board width stable.                                         |
| `intro`          | `boolean`                                          | `true`                                           | Start blank and flip to the first phrase on mount.                                          |
| `order`          | `'left' \| 'right' \| 'center' \| 'random'`        | `'left'`                                         | Where the cascade starts.                                                                   |
| `tile-style`     | `'board' \| 'minimal'`                             | `'board'`                                        | Mechanical tiles, or bare characters that flip on their own, split by a hinge line.         |
| `glare`          | `number`                                           | `0`                                              | Strength, 0 to 1, of the light sheen that sweeps down each tile as its flap falls.          |
| `depth`          | `number`                                           | `0.5`                                            | How physical the board feels, 0 (flat) to 1: hinge shadow, flap shading, cast shadow, edge. |
| `class`          | `string`                                           | `''`                                             | Extra classes for the root element.                                                         |

## Accessibility

- The tiles are `aria-hidden`. A visually hidden span holds the current phrase, so screen readers read words, not glyphs.
- With reduced motion, tiles swap straight to the next phrase with no flips.
- The cycle pauses while the browser tab is hidden.

- Ported from [React Bits](https://reactbits.dev/text-animations/split-flap-text) by David Haz.
