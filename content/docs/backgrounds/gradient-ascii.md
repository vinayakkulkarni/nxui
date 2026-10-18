---
title: Gradient ASCII
description: Soft gradient glows drawn in ASCII characters that scramble under the cursor.
---

A WebGL2 background that draws a drifting glow — a horizon, a pinched band, a rising light or an eclipse ring — and types it out in characters picked by brightness. Move the cursor over it to scramble the characters, which settle back a moment later, and click to send out a wave or burst.

::demo-gradient-ascii
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gradient-ascii.json"
```

## Usage

```vue
<script setup lang="ts">
  import GradientAscii from '~/components/ui/gradient-ascii/GradientAscii.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <GradientAscii
      :colors="['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']"
      shape="horizon"
      characters=" =+xX0S8#@"
      :cell-size="18"
      :density="0.8"
      :glow="0.2"
      click-effect="wave"
    />
  </div>
</template>
```

## Props

| Prop                | Type                                          | Default                                                                    | Description                                                                                                                                    |
| ------------------- | --------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors`            | `string[]`                                    | `['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']`                             | Two to eight colors for the light, from the edge of the shadow to the brightest or farthest point. Dark areas stay transparent.                |
| `shape`             | `'horizon' \| 'pinch' \| 'rise' \| 'eclipse'` | `'horizon'`                                                                | Horizon glows over a dark curve, pinch is a band of light squeezed in the middle, rise glows up from the bottom and eclipse rings a dark disc. |
| `characters`        | `string`                                      | `' =+xX0S8#@'`                                                             | Characters from dimmest to brightest. Brighter parts of the gradient use characters further along.                                             |
| `cell-size`         | `number`                                      | `18`                                                                       | Height of each character cell in px.                                                                                                           |
| `density`           | `number`                                      | `0.8`                                                                      | Share of cells that show a character, from 0 to 1. Brighter areas fill in first.                                                               |
| `glyph-opacity`     | `number`                                      | `0.85`                                                                     | How strongly the characters stand out from the gradient.                                                                                       |
| `gradient-opacity`  | `number`                                      | `0.9`                                                                      | Opacity of the gradient behind the characters. At 0 only the characters are left.                                                              |
| `glow`              | `number`                                      | `0.2`                                                                      | Soft glow around the characters, from 0 to 1.5.                                                                                                |
| `depth-of-field`    | `number`                                      | `0`                                                                        | Share of characters drawn out of focus, from 0 to 1.                                                                                           |
| `flicker`           | `number`                                      | `0.2`                                                                      | How often characters swap with their neighbors in brightness, from 0 to 1.                                                                     |
| `softness`          | `number`                                      | `0.5`                                                                      | How soft the edges of the shape are, from 0 to 1.                                                                                              |
| `scale`             | `number`                                      | `1`                                                                        | Size of the shape, from 0.4 to 2.5.                                                                                                            |
| `flow`              | `number`                                      | `0.5`                                                                      | How much the light wavers as it drifts, from 0 to 2.                                                                                           |
| `speed`             | `number`                                      | `1`                                                                        | Speed of the drift. 0 holds the shape still.                                                                                                   |
| `grain`             | `number`                                      | `0.08`                                                                     | Strength of the film grain, from 0 to 0.4.                                                                                                     |
| `variation`         | `number`                                      | `0`                                                                        | Picks a different drift and a different pattern of characters.                                                                                 |
| `mouse-interaction` | `boolean`                                     | `true`                                                                     | Scrambles the characters under the cursor as it moves. They settle back a moment later.                                                        |
| `scramble-radius`   | `number`                                      | `0.1`                                                                      | Size of the scrambled area around the cursor, relative to the container height.                                                                |
| `click-effect`      | `'wave' \| 'burst' \| 'none'`                 | `'wave'`                                                                   | Wave sends a ring of scrambled characters out from the click, burst scrambles a patch under it.                                                |
| `intro`             | `boolean`                                     | `true`                                                                     | Fades the light in from its source while the characters decode.                                                                                |
| `light-mode`        | `boolean`                                     | `false`                                                                    | Draws the gradient as a wash on light backgrounds, with characters a shade darker.                                                             |
| `font-family`       | `string`                                      | `'"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'` | Font used for the characters. Monospaced fonts keep the grid even.                                                                             |
| `dpr`               | `number`                                      | `auto`                                                                     | Maximum device pixel ratio, capped at 2.                                                                                                       |
| `class`             | `string`                                      | `''`                                                                       | Extra class names for the container.                                                                                                           |

## Accessibility

Gradient ASCII is decorative. It renders to a `<canvas>` marked `aria-hidden`, so screen readers skip it; put real content above it. Pointer listeners are passive and attached to the window, so content layered on top stays clickable. When `prefers-reduced-motion` is set, the drift, flicker, cursor scramble and click effects stop, the intro is skipped, and the renderer only redraws when a prop changes. Rendering pauses while the background is off screen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/backgrounds/gradient-ascii) by David Haz.
