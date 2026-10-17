---
title: Glitch Text
description: Glitching text with four styles — sliced bands, a jittering color split, a scanning tear or swapped glyphs — plus intensity, skew, flicker and click bursts.
---

Text that glitches. Pick one of four styles: sliced bands that shift sideways, a jittering RGB color split, a displaced band that scans down through the letters, or letters that briefly swap for glyphs. Set how hard it glitches, add a skew jolt and opacity flicker, and choose whether it runs all the time, while hovered, or in a short burst on each click. Pick a preset or tune it in the panel.

::demo-glitch-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glitch-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import GlitchText from '~/components/ui/glitch-text/GlitchText.vue';
</script>

<template>
  <GlitchText
    text="Click Me"
    mode="noise"
    trigger="click"
    :intensity="0.3"
    :burst-duration="0.9"
    :offset="14"
    :skew="10"
    flicker
    :shadow-colors="['#ff4d2e', '#ff4d2e']"
  />
</template>
```

## Props

| Prop              | Type                                     | Default                   | Description                                                                                                                                                |
| ----------------- | ---------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`            | `string`                                 | —                         | The text that glitches                                                                                                                                     |
| `mode`            | `'slices' \| 'rgb' \| 'scan' \| 'noise'` | `'slices'`                | Style of glitch. Slices shifts bands sideways, rgb splits into jittering color channels, scan sweeps a displaced band down, noise swaps letters for glyphs |
| `trigger`         | `'always' \| 'hover' \| 'click'`         | `'always'`                | When it glitches: all the time, while hovered, or in a short burst on each click                                                                           |
| `speed`           | `number`                                 | `0.5`                     | Multiplier for the animation speed. Higher values slow the glitch down                                                                                     |
| `intensity`       | `number`                                 | `0.5`                     | How often and how far it glitches, from `0` (calm) to `1` (constant, wide jolts)                                                                           |
| `burst-duration`  | `number`                                 | `0.6`                     | Length of the burst played on each click with the click trigger, in seconds                                                                                |
| `flicker`         | `boolean`                                | `false`                   | Adds quick, subtle dips in opacity while it glitches                                                                                                       |
| `offset`          | `number`                                 | `10`                      | How far the glitched slices shift sideways, in px. The colored shadows grow with it                                                                        |
| `skew`            | `number`                                 | `0`                       | How far the text shears sideways during a jolt, in degrees                                                                                                 |
| `enable-shadows`  | `boolean`                                | `true`                    | Toggle the glitch colors. Without them every mode stays in the text color                                                                                  |
| `shadow-colors`   | `[string, string]`                       | `['#ff0000', '#00ffff']`  | The two glitch colors: the shadows on the shifted slices, the split channels and the swapped glyphs                                                        |
| `color`           | `string`                                 | —                         | Color of the text. Follows the surrounding text color when unset                                                                                           |
| `font-size`       | `number \| string`                       | `clamp(2rem, 10vw, 8rem)` | Font size of the text. Numbers are in px                                                                                                                   |
| `font-weight`     | `number \| string`                       | `900`                     | Font weight of the text                                                                                                                                    |
| `enable-on-hover` | `boolean`                                | `false`                   | Same as `trigger="hover"`: the glitch only runs while hovered                                                                                              |
| `class`           | `string`                                 | `''`                      | Classes merged onto the root                                                                                                                               |

## Accessibility

- The glitch copies are `aria-hidden`. In noise mode the swapping letters are hidden too and a visually hidden copy carries the real text.
- When the user prefers reduced motion, the glitch never runs and the text stays still.
- The animation loop stops while off screen and whenever the trigger is idle.

- Ported from [React Bits](https://reactbits.dev/text-animations/glitch-text) by David Haz.
