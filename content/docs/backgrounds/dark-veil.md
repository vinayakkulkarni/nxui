---
title: Dark Veil
description: A silky veil of light that drifts in the dark and bends around the cursor.
---

A veil of light painted by a small neural network (CPPN) in one raw WebGL2 shader. It fades in as it unfolds, drifts slowly, and glows around its brightest folds. Move the cursor over it and the veil bends and swirls around the pointer while a soft light follows it. Any color works, `variation` picks a new shape, and `light-mode` draws it as colored ink on light pages. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-dark-veil
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dark-veil.json"
```

## Usage

```vue
<script setup lang="ts">
  import DarkVeil from '~/components/ui/dark-veil/DarkVeil.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <DarkVeil
      color="#6b12ff"
      :speed="0.5"
      :flow="1"
      :glow="0.4"
      :mouse-interaction="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `darkVeilPreset('ember')` returns the look of the Veil, Ember, Jade, Silver or Storm preset.

## Props

| Prop                | Type      | Default     | Description                                                                  |
| ------------------- | --------- | ----------- | ---------------------------------------------------------------------------- |
| `color`             | `string`  | `'#6b12ff'` | Color of the veil. Highlights are derived from it.                           |
| `speed`             | `number`  | `0.5`       | Animation speed.                                                             |
| `scale`             | `number`  | `1`         | Zoom of the veil. Higher values zoom in.                                     |
| `rotation`          | `number`  | `0`         | Turns the veil around the center, in degrees.                                |
| `flow`              | `number`  | `1`         | How much the veil drifts and changes shape over time.                        |
| `warp`              | `number`  | `0`         | Adds a gentle ripple to the veil.                                            |
| `variation`         | `number`  | `0`         | Picks a different veil shape. Any number works.                              |
| `brightness`        | `number`  | `1`         | Overall brightness.                                                          |
| `sheen`             | `number`  | `0`         | Silky highlights along the folds. They follow the cursor like a light.       |
| `glow`              | `number`  | `0.4`       | Soft glow around the brightest parts.                                        |
| `grain`             | `number`  | `0.03`      | Strength of the film grain.                                                  |
| `quality`           | `number`  | `0.5`       | Resolution of the veil, from 0.25 to 1. Lower is faster; 0.5 looks the same. |
| `mouse-interaction` | `boolean` | `true`      | Bends the veil and lights it up around the cursor.                           |
| `mouse-strength`    | `number`  | `1`         | How strongly the cursor bends the veil.                                      |
| `intro`             | `boolean` | `true`      | Fades the veil in as it unfolds.                                             |
| `fade`              | `number`  | `0`         | Fades the edges into the page, from 0 to 1.                                  |
| `opacity`           | `number`  | `1`         | Opacity of the whole effect.                                                 |
| `light-mode`        | `boolean` | `false`     | Draws the veil as colored ink for light backgrounds.                         |
| `paused`            | `boolean` | `false`     | Freezes the animation.                                                       |
| `dpr`               | `number`  | auto        | Maximum device pixel ratio, capped at 2.                                     |
| `class`             | `string`  | `''`        | Extra classes merged on the container.                                       |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- The pointer listener is passive and sits on `window`, so the veil never takes focus or clicks.
- With `prefers-reduced-motion: reduce` there is no intro, no drift and no cursor bend. The veil is drawn once and holds still.
- The render loop stops when the veil is paused and settled, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/dark-veil) by David Haz.
