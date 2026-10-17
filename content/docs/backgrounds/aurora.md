---
title: Aurora
description: A soft, calm aurora that flows across the top of the page and drifts toward the cursor.
---

A soft aurora curtain flows along the top of its container with smooth, band-free color blending. It fades in as it unfurls on load, and its edge reaches gently toward the cursor. It can also rise from the bottom or stack up to three curtains for depth.

::demo-aurora
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/aurora.json"
```

## Usage

```vue
<script setup lang="ts">
  import Aurora from '~/components/ui/aurora/Aurora.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-zinc-950">
    <Aurora
      :color-stops="['#7cff67', '#22d3c5', '#8f5cff']"
      :layers="3"
      :glow="1.2"
      :speed="0.6"
      :amplitude="1.4"
    />
  </div>
</template>
```

The aurora renders into a transparent WebGL2 canvas, so the container's
background shows through. Set `light-mode` on light pages: the aurora is then
drawn as soft pastel light that reads on white.

## Props

| Prop                | Type                | Default                             | Description                                                                       |
| ------------------- | ------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `color-stops`       | `string[]`          | `['#5227FF', '#7cff67', '#5227FF']` | Two to five colors that blend across the aurora from left to right.               |
| `amplitude`         | `number`            | `1`                                 | How tall the waves along the edge are.                                            |
| `blend`             | `number`            | `0.5`                               | How softly the edge fades out, from 0 to 1.                                       |
| `height`            | `number`            | `0.45`                              | How far the aurora reaches into the container, from 0 to 1.                       |
| `speed`             | `number`            | `1`                                 | Speed of the flowing motion.                                                      |
| `scale`             | `number`            | `1`                                 | Size of the waves. Lower values make broader, calmer shapes.                      |
| `glow`              | `number`            | `0.6`                               | How far the light spills softly past the edge.                                    |
| `brightness`        | `number`            | `1`                                 | Overall brightness of the light.                                                  |
| `layers`            | `number`            | `1`                                 | Number of curtains, from 1 to 3. Extra ones glow fainter behind for depth.        |
| `direction`         | `'top' \| 'bottom'` | `'top'`                             | Whether the aurora hangs from the top or rises from the bottom.                   |
| `mouse-interaction` | `boolean`           | `true`                              | The light gently reaches toward the cursor.                                       |
| `intro`             | `boolean`           | `true`                              | Fades the aurora in as it unfurls on mount.                                       |
| `opacity`           | `number`            | `1`                                 | Opacity of the whole effect.                                                      |
| `light-mode`        | `boolean`           | `false`                             | Draws the aurora as soft pastel light for white backgrounds.                      |
| `time`              | `number`            | —                                   | Drives the animation from your own clock, such as scroll progress, not real time. |
| `paused`            | `boolean`           | `false`                             | Freezes the animation.                                                            |
| `dpr`               | `number`            | auto                                | Maximum device pixel ratio, capped at 2.                                          |
| `class`             | `string`            | `''`                                | Extra classes for the container.                                                  |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Put your content above it.
- With `prefers-reduced-motion: reduce`, the aurora is drawn still, skips the intro and ignores the cursor.
- The animation pauses while the container is offscreen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/backgrounds/aurora) by David Haz.
