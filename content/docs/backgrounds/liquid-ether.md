---
title: Liquid Ether
description: A glowing liquid that swirls under the cursor, colored by how fast it flows, with a sweeping intro, click puffs, presets and a light mode.
---

A glowing liquid that swirls under the cursor. Calm areas take the first color and the fastest currents the last, so every stroke glows hotter at its core. On mount a swirl sweeps out from the center; while the cursor is away the liquid stirs itself. Move the pointer to push it, and click to shoot a puff in the direction you were moving. It runs a stable-fluids solver on raw WebGL2 at half-float precision and sleeps when the motion settles or the canvas scrolls out of view.

::demo-liquid-ether
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/liquid-ether.json"
```

## Usage

```vue
<script setup lang="ts">
  import LiquidEther from '~/components/ui/liquid-ether/LiquidEther.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <LiquidEther
      :colors="['#5227FF', '#FF9FFC', '#B497CF']"
      :mouse-force="20"
      :cursor-size="100"
      :persistence="0.75"
      click-burst
    />
  </div>
</template>
```

On a light page, pass `light-mode` so the flow renders as soft ink instead of glowing light.

## Props

| Prop                     | Type       | Default                             | Description                                                                                    |
| ------------------------ | ---------- | ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `colors`                 | `string[]` | `['#5227FF', '#FF9FFC', '#B497CF']` | Colors from slow to fast flow. Calm areas take the first color, the fastest currents the last. |
| `intensity`              | `number`   | `1`                                 | Brightness of the flow.                                                                        |
| `mouse-force`            | `number`   | `20`                                | How strongly the cursor pushes the liquid.                                                     |
| `cursor-size`            | `number`   | `100`                               | Size of the area the cursor stirs, in px.                                                      |
| `persistence`            | `number`   | `0.75`                              | How long the motion lingers before it settles, from 0 to 1.                                    |
| `viscosity`              | `number`   | `0`                                 | How thick the liquid is, from 0 to 1. Thicker liquid moves in broad, slow swirls.              |
| `resolution`             | `number`   | `0.5`                               | Detail of the simulation, from 0.1 to 1. Lower values are faster and softer.                   |
| `auto-demo`              | `boolean`  | `true`                              | Stirs the liquid on its own while the cursor is away.                                          |
| `auto-speed`             | `number`   | `0.5`                               | Speed of the automatic stirring.                                                               |
| `auto-intensity`         | `number`   | `2.2`                               | Strength of the automatic stirring compared with the cursor.                                   |
| `auto-resume-delay`      | `number`   | `1000`                              | Milliseconds without input before the automatic stirring resumes.                              |
| `click-burst`            | `boolean`  | `true`                              | Clicking shoots a puff of liquid in the direction the cursor was moving.                       |
| `bounce-edges`           | `boolean`  | `false`                             | The liquid bounces off the edges instead of flowing out of view.                               |
| `intro`                  | `boolean`  | `true`                              | A swirl sweeps out from the center on mount.                                                   |
| `light-mode`             | `boolean`  | `false`                             | Renders the flow as soft ink for light backgrounds.                                            |
| `background-color`       | `string`   | `'transparent'`                     | Solid color behind the flow. Leave transparent to show the page through.                       |
| `max-device-pixel-ratio` | `number`   | `2`                                 | Highest pixel ratio the canvas renders at.                                                     |
| `class`                  | `string`   | `''`                                | Extra classes for the container.                                                               |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Put real content above it.
- With `prefers-reduced-motion: reduce`, the intro sweep, the automatic stirring and click puffs are off; the liquid only moves when the pointer moves it.
- The animation pauses when the canvas is off screen or the tab is hidden, and stops once the motion settles.
- Pointer input is read from the window, so the canvas can sit under other content and still react.

- Ported from [React Bits](https://reactbits.dev/backgrounds/liquid-ether) by David Haz.
