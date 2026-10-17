---
title: Line Waves
description: Fine lines that flow in silky waves while a band of light drifts through them, with a cursor spotlight and click ripples.
---

Fine, crisp lines drawn in raw WebGL2 that bend into slow, silky waves while a soft band of light drifts through them. The lines draw in across the container on mount. Move the cursor and the lines spread apart and light up around it; click to send a smooth wave rolling out through them. Light mode draws the lines as deep ink for light backgrounds. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-line-waves
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/line-waves.json"
```

## Usage

```vue
<script setup lang="ts">
  import LineWaves from '~/components/ui/line-waves/LineWaves.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <LineWaves
      color1="#ffffff"
      color2="#ffffff"
      color3="#ffffff"
      :speed="0.3"
      :line-count="72"
      :line-width="1.3"
      :glow="0.6"
      :rotation="-33"
      :mouse-influence="2"
      :click-ripple="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `lineWavesPreset('gold')` returns the props of the Silk, Gold, Arctic, Aurora, Engraving, Ribbon, Storm or Calm preset.

## Props

| Prop                       | Type      | Default     | Description                                                                                                |
| -------------------------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `color1`                   | `string`  | `'#ffffff'` | First color the lines blend through.                                                                       |
| `color2`                   | `string`  | `'#ffffff'` | Second color the lines blend through.                                                                      |
| `color3`                   | `string`  | `'#ffffff'` | Third color the lines blend through.                                                                       |
| `color-cycle-speed`        | `number`  | `1`         | How fast the colors drift across the lines. `0` keeps them in place.                                       |
| `speed`                    | `number`  | `0.3`       | How fast the waves flow. `0` freezes them.                                                                 |
| `line-count`               | `number`  | `72`        | Number of lines across the height of the container.                                                        |
| `line-width`               | `number`  | `1.3`       | Thickness of the lines, in px.                                                                             |
| `glow`                     | `number`  | `0.6`       | Strength of the soft glow around each line.                                                                |
| `brightness`               | `number`  | `1`         | Overall brightness of the lines.                                                                           |
| `highlight`                | `number`  | `1`         | Strength of the band of light that drifts through the lines, from 0 to 1. At `0` every line is lit evenly. |
| `highlight-width`          | `number`  | `1`         | Width of the band of light. Higher values light more lines at once.                                        |
| `warp-intensity`           | `number`  | `1`         | How strongly the lines bend into waves.                                                                    |
| `warp-scale`               | `number`  | `1`         | Size of the waves. Higher values give broad, sweeping curves.                                              |
| `rotation`                 | `number`  | `-33`       | Angle of the lines, in degrees.                                                                            |
| `edge-fade`                | `number`  | `0`         | Fades the lines out toward the edges of the container, from 0 to 1.                                        |
| `enable-mouse-interaction` | `boolean` | `true`      | The lines spread apart and light up around the cursor.                                                     |
| `mouse-influence`          | `number`  | `2`         | How strongly the lines react to the cursor.                                                                |
| `click-ripple`             | `boolean` | `true`      | Clicking sends a smooth wave rolling out through the lines.                                                |
| `intro`                    | `boolean` | `true`      | The lines draw in across the container on mount.                                                           |
| `light-mode`               | `boolean` | `false`     | Draws the lines as ink for light backgrounds. Colors turn into deeper inks of the same hue.                |
| `opacity`                  | `number`  | `1`         | Overall opacity, from 0 to 1.                                                                              |
| `max-device-pixel-ratio`   | `number`  | `2`         | Highest pixel ratio the canvas renders at. The canvas also caps itself at about 2.4 million pixels.        |
| `class`                    | `string`  | `''`        | Extra classes merged on the container.                                                                     |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it and check its contrast against your line colors.
- Pointer listeners are passive and sit on `window`, so the lines never take focus or block clicks on content above them.
- With `prefers-reduced-motion: reduce` there is no intro, cursor spotlight or click ripple, and the waves flow at a quarter of the speed.
- The render loop stops when the lines are still, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/line-waves) by David Haz.
