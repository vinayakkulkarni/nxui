---
title: Grainient
description: Flowing grainy gradients you can stir with the cursor.
---

A grainy gradient that bends into slow waves on raw WebGL2. Moving the cursor drags the colors around like wet paint, and clicking twists them into a swirl that slowly unwinds. Turn up `bands` for stripes or rings, drop `softness` for crisp poster edges, or add `silk` for a satin sheen.

::demo-grainient
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/grainient.json"
```

## Usage

```vue
<script setup lang="ts">
  import Grainient from '~/components/ui/grainient/Grainient.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Grainient
      :colors="['#06101f', '#0c4a6e', '#0284c7', '#7dd3fc', '#f0f9ff']"
      :angle="0"
      :bands="3"
      :softness="0.25"
      :silk="0.3"
    />
  </div>
</template>
```

Colors are blended in OKLab, so mixes stay vivid instead of turning muddy. The gradient is rendered at half resolution and the grain is added at full resolution on top. Rendering stops when nothing moves, when the tab is hidden, and while the background is scrolled out of view.

## Props

| Prop             | Type                   | Default                                                   | Description                                                                                                          |
| ---------------- | ---------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `colors`         | `string[]`             | `['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa']` | Two to eight CSS colors, from the base to the highlight. Use your page background as the first color so edges blend. |
| `type`           | `'linear' \| 'radial'` | `'linear'`                                                | Linear runs the colors across the container. Radial puts the last color in the middle.                               |
| `angle`          | `number`               | `55`                                                      | Direction of a linear gradient in degrees, like CSS: 0 runs bottom to top, 90 left to right.                         |
| `bands`          | `number`               | `1`                                                       | How many times the colors repeat back and forth, from 1 to 8. Higher values make stripes or rings.                   |
| `softness`       | `number`               | `1`                                                       | Blend between colors, from 0 (crisp, poster-like edges) to 1 (smooth).                                               |
| `flow`           | `number`               | `0.8`                                                     | How much the gradient bends into waves, from 0 (straight) to 3. Above 1 it starts to marble.                         |
| `scale`          | `number`               | `1`                                                       | Size of the waves, from 0.25 to 3.                                                                                   |
| `speed`          | `number`               | `1`                                                       | Speed of the drifting waves. 0 holds them still.                                                                     |
| `silk`           | `number`               | `0.35`                                                    | Satin shading on the folds, from 0 to 1. Combine with bands for glossy ribbons.                                      |
| `grain-amount`   | `number`               | `0.08`                                                    | Strength of the film grain, from 0 to 0.5.                                                                           |
| `grain-size`     | `number`               | `1.2`                                                     | Size of the grain in pixels, from 0.5 to 4.                                                                          |
| `grain-animated` | `boolean`              | `true`                                                    | Shifts the grain every frame like film. When off, the grain stays fixed.                                             |
| `contrast`       | `number`               | `1`                                                       | Contrast of the colors, from 0.2 to 2.                                                                               |
| `saturation`     | `number`               | `1`                                                       | Saturation of the colors, from 0 (grayscale) to 2.                                                                   |
| `variation`      | `number`               | `0`                                                       | Picks a different pattern of waves.                                                                                  |
| `interactive`    | `boolean`              | `true`                                                    | Lets the cursor drag the colors around like paint. The trail settles back after a moment.                            |
| `stir`           | `number`               | `1`                                                       | How far the cursor drags the colors, from 0 to 2.                                                                    |
| `click-swirl`    | `boolean`              | `true`                                                    | Clicking twists the colors into a swirl that slowly unwinds.                                                         |
| `intro`          | `boolean`              | `true`                                                    | Blooms the colors out from the middle on mount.                                                                      |
| `light-mode`     | `boolean`              | `false`                                                   | Builds a light version of the palette: the first color becomes white and the others run in reverse, deepest last.    |
| `dpr`            | `number`               | auto                                                      | Maximum device pixel ratio, capped at 2.                                                                             |
| `class`          | `string`               | `''`                                                      | Extra classes for the container.                                                                                     |

## Accessibility

- The canvas is `aria-hidden`. Put real content on top of it in your own markup.
- Pointer input is read from `window`, so content layered on top stays fully interactive while the cursor still stirs the colors.
- With `prefers-reduced-motion: reduce` the waves and grain hold still and the cursor stir, click swirl and intro are turned off.

- Ported from [React Bits](https://reactbits.dev/backgrounds/grainient) by David Haz.
