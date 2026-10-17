---
title: Plasma
description: Soft folds of satin light that twist slowly through the dark, turn in 3D to follow the cursor and glow brighter near it.
---

Soft folds of satin light, raymarched in raw WebGL2, that twist slowly through the dark with bright highlights along their edges. The plasma fades in as it twists into place. Move the cursor and the whole volume turns in 3D to follow it, with a springy settle, and glows a little brighter nearby. Light mode draws it as tinted satin for light backgrounds. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-plasma
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/plasma.json"
```

## Usage

```vue
<script setup lang="ts">
  import Plasma from '~/components/ui/plasma/Plasma.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Plasma
      color="#a6a3b8"
      :speed="1"
      direction="forward"
      :twist="1"
      :softness="0.5"
      :shine="1"
      :mouse-interactive="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `plasmaPreset('copper')` returns the props of the Silver, Copper, Ocean, Jade or Vortex preset.

## Props

| Prop                | Type                                   | Default     | Description                                                                 |
| ------------------- | -------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `color`             | `string`                               | `'#a6a3b8'` | Color of the plasma. Highlights are derived from it.                        |
| `speed`             | `number`                               | `1`         | Animation speed.                                                            |
| `direction`         | `'forward' \| 'reverse' \| 'pingpong'` | `'forward'` | Which way the plasma flows. Ping pong eases back and forth.                 |
| `scale`             | `number`                               | `1`         | Zoom of the plasma. Higher values zoom in.                                  |
| `twist`             | `number`                               | `1`         | How tightly the plasma spirals.                                             |
| `wave`              | `number`                               | `1`         | How much the plasma ripples as it flows.                                    |
| `softness`          | `number`                               | `0.5`       | How soft the folds of light are, from 0 for crisp to 1 for misty.           |
| `shine`             | `number`                               | `1`         | Strength of the bright highlights along the folds.                          |
| `brightness`        | `number`                               | `1`         | Overall brightness.                                                         |
| `grain`             | `number`                               | `0.04`      | Strength of the film grain.                                                 |
| `quality`           | `number`                               | `0.75`      | Render resolution, from 0.25 to 1. Lower values run faster on slow devices. |
| `mouse-interactive` | `boolean`                              | `true`      | Turns the plasma in 3D to follow the cursor and brightens it nearby.        |
| `intro`             | `boolean`                              | `true`      | Fades the plasma in as it twists into place.                                |
| `fade`              | `number`                               | `0`         | Fades the edges into the page, from 0 to 1.                                 |
| `opacity`           | `number`                               | `1`         | Opacity of the whole effect.                                                |
| `light-mode`        | `boolean`                              | `false`     | Draws the plasma as tinted satin for light backgrounds.                     |
| `paused`            | `boolean`                              | `false`     | Freezes the animation.                                                      |
| `dpr`               | `number`                               | auto        | Maximum device pixel ratio, capped at 2.                                    |
| `class`             | `string`                               | `''`        | Extra classes merged on the container.                                      |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it and check its contrast against your plasma color.
- The pointer listener is passive and sits on `window`, so the plasma never takes focus or blocks clicks on content above it.
- With `prefers-reduced-motion: reduce` there is no intro, flow or cursor turn. The plasma is drawn and holds still.
- The render loop stops when the plasma is paused and settled, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/plasma) by David Haz.
