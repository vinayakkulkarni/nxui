---
title: Silk
description: Flowing satin folds with glossy highlights that turn toward the cursor and ripple on click.
---

Flowing satin folds drawn in raw WebGL2 with deep shading, glossy highlights and a soft glow. The folds rise out of the dark and settle on load, then keep flowing. Move the cursor and the light turns to follow it while the fabric drags along with the motion; click to send a ripple rolling through the cloth. Light mode draws pale silk with white highlights. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-silk
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/silk.json"
```

## Usage

```vue
<script setup lang="ts">
  import Silk from '~/components/ui/silk/Silk.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Silk
      color="#5227FF"
      :speed="5"
      :scale="1"
      :sheen="0.5"
      :depth="0.5"
      :glow="0.3"
      :noise-intensity="1.5"
      :click-ripple="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `silkPreset('champagne')` returns the props of the Satin, Classic, Champagne, Midnight, Emerald, Graphite or Velvet preset. Classic turns off sheen, depth and glow for the original flat look.

## Props

| Prop                   | Type      | Default     | Description                                                                   |
| ---------------------- | --------- | ----------- | ----------------------------------------------------------------------------- |
| `color`                | `string`  | `'#7B7481'` | Color of the silk.                                                            |
| `sheen-color`          | `string`  | `'#ffffff'` | Tint of the glossy highlights, blended with the silk color.                   |
| `speed`                | `number`  | `5`         | How fast the folds flow.                                                      |
| `scale`                | `number`  | `1`         | Size of the folds. Higher values pack more in.                                |
| `rotation`             | `number`  | `0`         | Turns the folds, in radians.                                                  |
| `noise-intensity`      | `number`  | `1.5`       | Strength of the fine grain over the fabric.                                   |
| `sheen`                | `number`  | `0.5`       | Strength of the glossy highlights that run along the folds.                   |
| `depth`                | `number`  | `0.5`       | How deep the folds look, from flat at 0 to deep, shaded creases at 1.         |
| `glow`                 | `number`  | `0.3`       | Soft glow around the brightest folds.                                         |
| `ripple`               | `number`  | `1`         | Strength of the fine ripples running through the folds. `0` smooths them out. |
| `wave`                 | `number`  | `1`         | How much the folds sway as they flow.                                         |
| `variation`            | `number`  | `0`         | Picks a different arrangement of folds. Any number works.                     |
| `mouse-interaction`    | `boolean` | `true`      | The light turns to follow the cursor and the fabric drags along with it.      |
| `interaction-strength` | `number`  | `1`         | How strongly the cursor moves the fabric and its light.                       |
| `click-ripple`         | `boolean` | `true`      | Clicking sends a ripple rolling through the fabric.                           |
| `intro`                | `boolean` | `true`      | The folds rise out of the dark and settle when the silk first appears.        |
| `fade`                 | `number`  | `0`         | Fades the edges into the page, from 0 to 1.                                   |
| `light-mode`           | `boolean` | `false`     | Draws pale silk with white highlights for light backgrounds.                  |
| `paused`               | `boolean` | `false`     | Freezes the animation.                                                        |
| `dpr`                  | `number`  | auto        | Maximum device pixel ratio, capped at 2.                                      |
| `class`                | `string`  | `''`        | Extra classes merged on the container.                                        |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it and check its contrast against your silk color.
- Pointer listeners are passive and sit on `window`, so the fabric never takes focus or blocks clicks on content above it.
- With `prefers-reduced-motion: reduce` there is no intro, flow, cursor drag or click ripple. The silk is drawn and holds still.
- The render loop stops when the silk is paused and settled, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/silk) by David Haz.
