---
title: Text Pressure
description: Variable-font text whose letters swell in weight, width and slant near the cursor, with click ripples, idle wave or pulse motion and a pressure color.
---

Variable-font letters that swell toward the cursor. Each letter's weight, width and slant follow how close the pointer is, with adjustable reach and smoothing. Click to send a ripple of pressure through the word. While the cursor is away, the word can keep rolling a wave or breathing in and out, and letters can warm toward an accent color as they swell. Move over the text, click it, or pick a preset in the panel.

::demo-text-pressure
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-pressure.json"
```

## Usage

```vue
<script setup lang="ts">
  import TextPressure from '~/components/ui/text-pressure/TextPressure.vue';
</script>

<template>
  <div class="relative h-100 w-full">
    <TextPressure
      text="Hello!"
      idle="pulse"
      pressure-color="#ff5a1f"
      :radius="0.4"
      :smoothing="0.3"
      :flex="false"
      :italic="false"
      :min-font-size="36"
    />
  </div>
</template>
```

The font size fills the container width. The default font is Roboto Flex from Google Fonts; any variable font with `wght`, `wdth` and `ital` axes works through `font-family` and `font-url`.

## Props

| Prop             | Type                          | Default                     | Description                                                                                                   |
| ---------------- | ----------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `text`           | `string`                      | `'Compressa'`               | Text that is displayed and animated                                                                           |
| `font-family`    | `string`                      | `'Roboto Flex'`             | Name of the variable font family                                                                              |
| `font-url`       | `string`                      | Roboto Flex on Google Fonts | Stylesheet URL that loads the variable font. The font needs width, weight and italic axes                     |
| `text-color`     | `string`                      | `'currentColor'`            | Fill color of the text                                                                                        |
| `pressure-color` | `string`                      | `''`                        | Letters blend toward this color as they swell under pressure. Empty keeps one color                           |
| `stroke-color`   | `string`                      | `'#FF0000'`                 | Color of the outline when stroke is on                                                                        |
| `idle`           | `'none' \| 'wave' \| 'pulse'` | `'none'`                    | What the letters do while the pointer is away. A wave rolls a swell across the word, a pulse makes it breathe |
| `idle-speed`     | `number`                      | `1`                         | Speed of the idle wave or pulse. `2` plays it twice as fast                                                   |
| `radius`         | `number`                      | `0.5`                       | How far the cursor's pull reaches, as a fraction of the text width. Also sets the length of the idle wave     |
| `smoothing`      | `number`                      | `0.5`                       | How softly the letters follow the cursor, from `0` for instant to `1` for a slow, floaty glide                |
| `click-ripple`   | `boolean`                     | `true`                      | Clicking sends a wave of pressure rippling outward through the letters                                        |
| `flex`           | `boolean`                     | `true`                      | Spreads the letters across the full width                                                                     |
| `scale`          | `boolean`                     | `false`                     | Stretches the text vertically to fill the height of its container                                             |
| `alpha`          | `boolean`                     | `false`                     | Fades letters out the further they are from the cursor                                                        |
| `stroke`         | `boolean`                     | `false`                     | Draws an outline behind each letter                                                                           |
| `width`          | `boolean`                     | `true`                      | Varies the width axis of the font with pressure                                                               |
| `weight`         | `boolean`                     | `true`                      | Varies the weight axis of the font with pressure                                                              |
| `italic`         | `boolean`                     | `true`                      | Varies the italic axis of the font with pressure                                                              |
| `stroke-width`   | `number`                      | `3`                         | Width of the outline when stroke is on, in px. About half of it shows around the letters                      |
| `min-font-size`  | `number`                      | `24`                        | Minimum font size, so the text never gets too small on narrow screens                                         |
| `class`          | `string`                      | `''`                        | Classes merged onto the wrapper                                                                               |

## Accessibility

- The heading carries the full text as `aria-label`; the per-letter spans are `aria-hidden`.
- When the user prefers reduced motion, the idle wave and pulse are off; letters still respond to the cursor.
- The animation loop sleeps once the letters settle and pauses while off screen.

- Ported from [React Bits](https://reactbits.dev/text-animations/text-pressure) by David Haz.
