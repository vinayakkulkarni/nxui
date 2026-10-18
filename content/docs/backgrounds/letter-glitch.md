---
title: Letter Glitch
description: A calm field of letters that flicker, scramble and glitch in color, stirred by the cursor and torn by clicks.
---

A crisp grid of letters drawn by one raw WebGL2 shader from a glyph atlas. Letters scramble quietly at rest, soft waves of light drift across them and random runs glitch into color. Move the cursor to light up and scramble the letters around it; move fast to leave a trail of glitches. Click to tear a glitch through the rows, or switch the click effect to a burst. Pick a preset in the demo panel, or press refresh to replay the boot-in flicker.

::demo-letter-glitch
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/letter-glitch.json"
```

## Usage

```vue
<script setup lang="ts">
  import LetterGlitch from '~/components/ui/letter-glitch/LetterGlitch.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <LetterGlitch
      :glitch-colors="['#ffffff', '#61dca3']"
      :glitch-amount="0.5"
      :flow="0.5"
      click-effect="tear"
    />
  </div>
</template>
```

The demo presets ship with the component: `letterGlitchPreset('terminal', isLight)` returns the look of the Signature, Classic, Terminal, Binary, Hex, Sparse, Storm or Pixel preset, with its light-mode colors when the second argument is `true`. Its `font` and `charset` keys map to `LETTER_GLITCH_FONTS` and `LETTER_GLITCH_CHARSETS`.

## Props

| Prop               | Type                          | Default                  | Description                                                                                   |
| ------------------ | ----------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `glitch-colors`    | `string[]`                    | `['#ffffff', '#61dca3']` | Up to 8 colors that glitching letters light up in. Light mode defaults to dark ink tones.     |
| `base-color`       | `string`                      | `'#ffffff'`              | Color of the letters at rest. Light mode defaults to near black.                              |
| `characters`       | `string`                      | `'ABC…XYZ!@#$&*()…0-9'`  | Characters to draw. Repeat a character to make it appear more often.                          |
| `font-family`      | `string`                      | `'ui-monospace, …'`      | CSS font family for the letters. Web fonts are drawn once they have loaded.                   |
| `font-size`        | `number`                      | `14`                     | Size of the letters in pixels (6–96).                                                         |
| `spacing`          | `number`                      | `0.6`                    | Room around each letter relative to the font size. 0 packs them like lines of text.           |
| `density`          | `number`                      | `0.9`                    | Share of the grid that shows a letter at rest, from 0 to 1. Empty cells still flicker.        |
| `base-opacity`     | `number`                      | `0.16`                   | Opacity of the letters at rest, from 0 to 1.                                                  |
| `glitch-amount`    | `number`                      | `0.5`                    | How often letters glitch, from 0 (never) to 1 (constantly).                                   |
| `speed`            | `number`                      | `1`                      | Tempo of the scrambling and glitches. 0 freezes the letters.                                  |
| `flow`             | `number`                      | `0.5`                    | Strength of the soft waves of light that drift across the letters, from 0 to 1.               |
| `smooth`           | `boolean`                     | `true`                   | Fades glitching letters in and out. When off, they flicker on and off instantly.              |
| `interactive`      | `boolean`                     | `true`                   | Lights up and scrambles the letters near the cursor, leaving a trail of glitches as it moves. |
| `cursor-radius`    | `number`                      | `140`                    | Radius of the area around the cursor that reacts, in pixels.                                  |
| `click-effect`     | `'tear' \| 'burst' \| 'none'` | `'tear'`                 | What a click does. Tear rips a glitch through the rows, burst sends glitches outward.         |
| `edge-fade`        | `number`                      | `0`                      | Fades the letters out toward the edges, from 0 to 0.5.                                        |
| `center-fade`      | `number`                      | `0`                      | Clears the letters behind the middle of the container to keep content readable, 0 to 1.       |
| `intro`            | `boolean`                     | `true`                   | Boots the letters in with a flicker on mount.                                                 |
| `light-mode`       | `boolean`                     | `false`                  | Switches the default colors to dark ink for light backgrounds.                                |
| `background-color` | `string`                      | —                        | Paints an opaque background behind the letters. Leave it unset for a transparent canvas.      |
| `dpr`              | `number`                      | auto                     | Maximum device pixel ratio, capped at 2.                                                      |
| `class`            | `string`                      | `''`                     | Extra classes merged on the container.                                                        |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it; `center-fade` keeps the middle clear for it.
- Pointer listeners are passive and sit on `window`, so the field never steals focus or clicks from your UI.
- With `prefers-reduced-motion: reduce` there is no intro, no scrambling, no cursor effect and no click effect. The letters are drawn once and hold still.
- The render loop stops when the field is idle, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/letter-glitch) by David Haz.
