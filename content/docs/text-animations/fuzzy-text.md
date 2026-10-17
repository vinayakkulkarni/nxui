---
title: Fuzzy Text
description: Canvas text that shivers in shifted strips, resolves out of static on first view, splits into color fringes, and reacts to hover, clicks or timed glitches.
---

Text drawn on a canvas and sliced into thin strips that jitter sideways, up and down, or both. Hover the text to raise the fuzz, or switch the trigger to run it all the time or fire a burst on each click. Turn on the intro and the text fades in as coarse static that settles into clean letters; color split tears it into offset red, green and blue copies. Try the presets in the panel.

::demo-fuzzy-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fuzzy-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import FuzzyText from '~/components/ui/fuzzy-text/FuzzyText.vue';
</script>

<template>
  <FuzzyText
    text="404"
    :font-size="140"
    :base-intensity="0.2"
    :hover-intensity="0.5"
    intro
  />
  <FuzzyText
    text="GLITCH"
    trigger="click"
    :color-split="0.6"
    :slice-size="5"
    :fuzz-range="50"
    glitch-mode
  />
</template>
```

The canvas follows the surrounding text color by default (`currentColor`), so it switches with the theme. Presets from the demo are exported as `fuzzyTextPreset('static' | 'glitch' | 'shiver' | 'melt')`.

## Props

| Prop                  | Type                                   | Default                    | Description                                                                                                          |
| --------------------- | -------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `text`                | `string`                               | —                          | The text to draw                                                                                                     |
| `font-size`           | `number \| string`                     | `'clamp(2rem, 8vw, 8rem)'` | Any CSS size or a number in px. Responsive sizes redraw on window resize                                             |
| `font-weight`         | `number \| string`                     | `900`                      | Font weight                                                                                                          |
| `font-family`         | `string`                               | `'inherit'`                | Font family. `'inherit'` uses the font of the surrounding text                                                       |
| `color`               | `string`                               | `'currentColor'`           | Text color. Follows the surrounding text color by default, including theme switches                                  |
| `color-split`         | `number`                               | `0`                        | 0–1. Splits the text into offset RGB copies that tear apart with the fuzz. Dark text splits into cyan/magenta/yellow |
| `trigger`             | `'hover' \| 'always' \| 'click'`       | `'hover'`                  | What raises the fuzz: the pointer, always on, or a burst per click that eases back                                   |
| `enable-hover`        | `boolean`                              | `true`                     | Raise the fuzz to `hover-intensity` while the pointer is over the text (trigger `hover`)                             |
| `base-intensity`      | `number`                               | `0.18`                     | Fuzz strength at rest                                                                                                |
| `hover-intensity`     | `number`                               | `0.5`                      | Fuzz while hovered. The constant level for `always`, the burst strength for `click`                                  |
| `fuzz-range`          | `number`                               | `30`                       | Furthest a strip can shift (px)                                                                                      |
| `slice-size`          | `number`                               | `1`                        | Strip thickness (px). 1 is a fine fuzz, larger values tear the text into bands                                       |
| `fps`                 | `number`                               | `60`                       | Frame rate cap                                                                                                       |
| `direction`           | `'horizontal' \| 'vertical' \| 'both'` | `'horizontal'`             | Which way the strips shift                                                                                           |
| `transition-duration` | `number`                               | `0`                        | Frames the fuzz takes to ease between intensities. 0 switches instantly                                              |
| `intro`               | `boolean`                              | `false`                    | Fade in as heavy, coarse static that resolves into clean letters the first time it is drawn                          |
| `intro-duration`      | `number`                               | `1400`                     | Intro length (ms)                                                                                                    |
| `click-effect`        | `boolean`                              | `false`                    | Short full-intensity burst on click (trigger `hover` or `always`)                                                    |
| `glitch-mode`         | `boolean`                              | `false`                    | Full-intensity bursts at a regular interval                                                                          |
| `glitch-interval`     | `number`                               | `2000`                     | Time between glitch bursts (ms)                                                                                      |
| `glitch-duration`     | `number`                               | `200`                      | Length of each glitch burst (ms)                                                                                     |
| `gradient`            | `string[] \| null`                     | `null`                     | Two or more colors for a left-to-right gradient fill                                                                 |
| `letter-spacing`      | `number`                               | `0`                        | Extra space between letters (px)                                                                                     |
| `class`               | `string`                               | `''`                       | Extra classes on the canvas                                                                                          |

## Accessibility

- The canvas has `role="img"` and an `aria-label` with the text, so screen readers read it as plain text.
- With `prefers-reduced-motion: reduce` the rest fuzz drops to 0, the intro and glitch bursts are skipped, and `always` holds the base level.
- The render loop pauses while the canvas is off screen and stops redrawing once the text is still.

- Ported from [React Bits](https://reactbits.dev/text-animations/fuzzy-text) by David Haz.
