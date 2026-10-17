---
title: ASCII Text
description: Waving ASCII text that tilts toward the pointer, scrambles on hover and ripples on click.
---

Text drawn as a grid of ASCII characters by a single WebGL2 shader, so the letters and the coloured blocks under them never drift apart. The word waves, sways and decodes out of random characters on load. Move the pointer to tilt it and spin its hue, hover to scramble the characters near the cursor, and click to send a ring of characters across the canvas. Pick a preset or tune every value in the panel.

::demo-ascii-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ascii-text.json"
```

## Usage

The component fills its nearest positioned parent (`absolute inset-0`), so give that parent a height.

```vue
<script setup lang="ts">
  import ASCIIText from '~/components/ui/ascii-text/ASCIIText.vue';
</script>

<template>
  <div class="relative h-110 w-full overflow-hidden">
    <ASCIIText
      text="Hey!"
      :ascii-font-size="8"
      :colors="['#ff6188', '#fc9867', '#ffd866']"
      :blocks="0.9"
      :scramble="0.6"
      theme="dark"
    />
  </div>
</template>
```

Presets from the demo ship with the component:

```ts
import { asciiTextPreset } from '~/components/ui/ascii-text';

const terminal = asciiTextPreset('terminal'); // classic | terminal | blocks | binary | mono
```

## Props

| Prop              | Type                | Default                             | Description                                                         |
| ----------------- | ------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `text`            | `string`            | `'Hey!'`                            | Text rendered in ASCII                                              |
| `ascii-font-size` | `number`            | `8`                                 | Height of each character cell in px. Smaller cells give more detail |
| `charset`         | `string`            | ``' .'`^",:;Il!i~+_-?][}{1)(…'``    | Characters from darkest to brightest. Unicode blocks work too       |
| `colors`          | `string[]`          | `['#ff6188', '#fc9867', '#ffd866']` | Character gradient from the center outward, up to three colors      |
| `text-color`      | `string`            | `'#fdf9f3'`                         | Color of the text behind the characters                             |
| `font-family`     | `string`            | `'IBM Plex Mono', ui-monospace, …`  | Font for the text and the characters                                |
| `font-weight`     | `number`            | `600`                               | Weight of the rendered text                                         |
| `text-scale`      | `number`            | `1`                                 | Size of the text relative to the container (0.1–3)                  |
| `blocks`          | `number`            | `0.9`                               | Opacity of the colored pixel blocks under the characters (0–1)      |
| `waves`           | `number`            | `1`                                 | Strength of the wavy motion. `0` keeps the text flat                |
| `wave-speed`      | `number`            | `1`                                 | Speed of the wavy motion                                            |
| `chroma`          | `number`            | `1`                                 | Amount of color fringing around the letters                         |
| `tilt`            | `number`            | `1`                                 | How far the text turns toward the pointer                           |
| `hue-shift`       | `number`            | `1`                                 | Hue rotation as the pointer circles the text. `0` keeps colors      |
| `scramble`        | `number`            | `0.6`                               | Size and strength of the scramble under the pointer (0–1)           |
| `click-ripple`    | `boolean`           | `true`                              | Send a ring of characters across the canvas from each click         |
| `intro`           | `boolean`           | `true`                              | Decode the text out of random characters on load                    |
| `idle`            | `boolean`           | `true`                              | Sway the text gently when nobody interacts                          |
| `interactive`     | `boolean`           | `true`                              | React to the pointer with tilt, hue, scramble and ripples           |
| `theme`           | `'dark' \| 'light'` | `'dark'`                            | `light` inverts the colors so the effect works on white pages       |
| `class`           | `string`            | `''`                                | Extra classes on the root                                           |

## Accessibility

- The root has `role="img"` and an `aria-label` equal to `text`, so screen readers read the word, not the characters.
- With `prefers-reduced-motion: reduce` the waves, idle sway and intro decode stop; the text still renders.
- The render loop pauses while the canvas is off screen. Without WebGL2 the plain text is shown instead.

- Ported from [React Bits](https://reactbits.dev/text-animations/ascii-text) by David Haz.
