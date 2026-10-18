---
title: Scrambled Text
description: Text that decodes into view, then scrambles, rises, blurs or swells like a lens near the cursor, with a click that sends a scramble wave through it.
---

Text that reacts to the pointer. It decodes from scrambled characters the first time it scrolls into view. Letters near the cursor scramble, rise, blur or swell like a lens, each easing in and out with a soft falloff, and a click sends a scramble wave outward from the click point. Pick a preset or tune it in the panel.

::demo-scrambled-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scrambled-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import ScrambledText from '~/components/ui/scrambled-text/ScrambledText.vue';
</script>

<template>
  <ScrambledText
    text="Once you hover over me, you will see the effect in action!"
    effect="magnify"
    :radius="90"
    :trail="0.35"
    :duration="0.8"
    :speed="1"
    scramble-chars="<>/*"
    scramble-color="#ff5a1f"
    font-family="'Geist Mono', monospace"
  />
</template>
```

Every letter keeps an invisible copy of itself as a sizer and draws the scrambled glyph on top, so the layout never jumps — in any typeface. Lift, blur and magnify run on one rAF loop that sleeps when nothing moves.

## Props

| Prop             | Type                                          | Default      | Description                                                                                                  |
| ---------------- | --------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| `text`           | `string`                                      | —            | The text to scramble                                                                                         |
| `effect`         | `'scramble' \| 'lift' \| 'blur' \| 'magnify'` | `'scramble'` | What happens to letters near the pointer: they scramble, rise, blur, or swell like a lens                    |
| `radius`         | `number`                                      | `100`        | Distance from the pointer, in px, within which letters react                                                 |
| `strength`       | `number`                                      | `1`          | How far letters lift, how much they blur, or how much they magnify                                           |
| `trail`          | `number`                                      | `0.6`        | Seconds lifted, blurred or magnified letters take to settle after the pointer moves on                       |
| `duration`       | `number`                                      | `1.2`        | How long a letter right under the pointer keeps scrambling, in seconds. Also paces the intro and click burst |
| `speed`          | `number`                                      | `0.5`        | How often a scrambling letter swaps to a new character. Higher values flicker faster                         |
| `click-burst`    | `boolean`                                     | `true`       | Clicking sends a scramble wave outward from the click point, carrying the current effect with it             |
| `scramble-chars` | `string`                                      | `'.:'`       | The characters shown while a letter is scrambled                                                             |
| `scramble-color` | `string`                                      | `''`         | Color of letters while they are scrambled. Empty keeps the text color                                        |
| `color`          | `string`                                      | `''`         | Color of the text. Empty follows the surrounding text color                                                  |
| `font-family`    | `string`                                      | `''`         | Font of the text. Empty keeps the default monospace                                                          |
| `intro`          | `boolean`                                     | `true`       | Decode the whole text from scrambled characters the first time it scrolls into view                          |
| `class`          | `string`                                      | `''`         | Classes merged onto the wrapper                                                                              |

## Accessibility

- The real text sits in a visually hidden span; the animated letters are `aria-hidden`, so screen readers read the text once, unscrambled.
- When the user prefers reduced motion, the intro decode and the lift, blur and magnify effects are skipped.

- Ported from [React Bits](https://reactbits.dev/text-animations/scrambled-text) by David Haz.
