---
title: Strands
description: Spectral strands that twist inside a frosted glass orb and swell into one smooth bulge where they come together, like the new Siri.
---

# Strands

A voice-assistant orb drawn by one WebGL2 shader. Ribbons of red, amber and blue light twist inside a glass sphere and swell into a bright bulge where they meet; the glass bends and splits the light along its rim. The light livens up on its own, follows a voice level you feed it (or a built-in speech rhythm with `listening`), tilts toward the cursor as it gets close, and a click sends a burst through it. Turn `glass` off for the light on its own, and `light-mode` on for light pages.

::demo-strands
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/strands.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import Strands from '~/components/ui/strands/Strands.vue';

  // 0–1, for example the volume of a microphone stream.
  const micLevel = ref<number | undefined>(undefined);
</script>

<template>
  <div class="relative h-125 w-full">
    <Strands :energy="0.65" :level="micLevel" />
  </div>
</template>
```

## Props

| Prop                     | Type       | Default      | Description                                                                                                                                        |
| ------------------------ | ---------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors`                 | `string[]` | Siri palette | Colors in order: the red top edge of the bulge, orange, amber, the warm white core, cyan, blue and deep blue. Fewer colors are spread across them. |
| `count`                  | `number`   | `3`          | How many strands show inside the bulge of light, from 1 to 3.                                                                                      |
| `speed`                  | `number`   | `1`          | How fast the light turns. 0 holds it still.                                                                                                        |
| `amplitude`              | `number`   | `1`          | How tall the arch rises and how deeply the ribbon curves.                                                                                          |
| `waviness`               | `number`   | `1`          | How tightly the ribbon twists along its length.                                                                                                    |
| `energy`                 | `number`   | `0.65`       | How lively the light is on its own, from 0 (a calm white line) to 1 (ribbons fully open).                                                          |
| `thickness`              | `number`   | `1`          | How thick the edges of the light are, and the white core where the ribbon turns edge-on.                                                           |
| `spread`                 | `number`   | `1`          | How wide the ribbon opens, fanning its colors out.                                                                                                 |
| `glow`                   | `number`   | `1`          | Strength of the soft glow around the light.                                                                                                        |
| `taper`                  | `number`   | `1`          | How quickly the light fades toward the sides of the orb.                                                                                           |
| `intensity`              | `number`   | `1`          | Overall brightness of the light.                                                                                                                   |
| `saturation`             | `number`   | `1`          | Color saturation of the light. 0 is greyscale.                                                                                                     |
| `hue-shift`              | `number`   | `0`          | Rotates the colors around the color wheel, from 0 to 1.                                                                                            |
| `scale`                  | `number`   | `1`          | Width of the light.                                                                                                                                |
| `glass`                  | `boolean`  | `true`       | Shows the glass orb. Turn it off for the light on its own.                                                                                         |
| `glass-size`             | `number`   | `1`          | Size of the glass orb.                                                                                                                             |
| `refraction`             | `number`   | `1`          | How strongly the edge of the glass bends the light, wrapping the colors around its rim.                                                            |
| `rim`                    | `number`   | `1`          | Brightness of the glass rim and the light it catches.                                                                                              |
| `dispersion`             | `number`   | `1`          | Amount of rainbow color separation along the edge of the glass.                                                                                    |
| `listening`              | `boolean`  | `false`      | Animates the orb as if it were hearing someone speak.                                                                                              |
| `level`                  | `number`   | `undefined`  | Drives the orb from your own audio level, from 0 to 1. Overrides `listening`.                                                                      |
| `interactive`            | `boolean`  | `true`       | The light tilts toward the cursor and stirs as it gets close.                                                                                      |
| `click-pulse`            | `boolean`  | `true`       | Clicking sends a burst of motion through the light.                                                                                                |
| `intro`                  | `boolean`  | `true`       | The orb fades in and the light unfolds from the center when it first appears.                                                                      |
| `light-mode`             | `boolean`  | `false`      | For light pages. The orb turns into frosted white glass and the strands use deeper colors with a warm core.                                        |
| `opacity`                | `number`   | `1`          | Overall opacity.                                                                                                                                   |
| `max-device-pixel-ratio` | `number`   | `2`          | Highest pixel ratio the canvas renders at.                                                                                                         |
| `class`                  | `string`   | `''`         | Extra classes for the container.                                                                                                                   |

## Accessibility

- The canvas is decorative (`aria-hidden`). Pair the orb with a visible text or button state when it represents a listening assistant.
- With `prefers-reduced-motion: reduce` the intro is skipped, the light stops turning, the speech rhythm is off and the loop stops once the light settles.
- The render loop pauses when the orb is offscreen or the tab is hidden, and it recovers from a lost WebGL context.

- Ported from [React Bits](https://reactbits.dev/animations/strands) by David Haz.
