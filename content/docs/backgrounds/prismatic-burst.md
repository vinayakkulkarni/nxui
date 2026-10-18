---
title: Prismatic Burst
description: A burst of prismatic light rays that leans toward the cursor and sends a wave of light outward on click.
---

A raymarched burst of colored light rays drawn with raw WebGL2. It ignites from the center when it mounts. Move the cursor over it and the burst leans toward you while the rays near the cursor brighten. Click to send a wave of light racing outward.

::demo-prismatic-burst
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/prismatic-burst.json"
```

## Usage

```vue
<script setup lang="ts">
  import PrismaticBurst from '~/components/ui/prismatic-burst/PrismaticBurst.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-black">
    <PrismaticBurst
      :colors="['#A855F7', '#7C3AED', '#6366F1']"
      animation-type="rotate3d"
      :intensity="2"
      :speed="0.5"
    />
  </div>
</template>
```

The rays render at a reduced resolution into a float buffer, then a second
pass upscales them with a bicubic filter and adds the optional bloom, edge
fade and light-mode ink. The render scale drops on its own when frames run
slow. The loop stops when the burst is paused and settled, off screen, or the
tab is hidden.

## Props

| Prop                | Type                                             | Default          | Description                                                                  |
| ------------------- | ------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------- |
| `colors`            | `string[]`                                       | `undefined`      | Colors blended through the rays, up to 64. Leave empty for a full spectrum.  |
| `intensity`         | `number`                                         | `2`              | Overall brightness of the rays.                                              |
| `speed`             | `number`                                         | `0.5`            | How fast the burst turns and shifts.                                         |
| `animation-type`    | `'rotate' \| 'rotate3d' \| 'hover'`              | `'rotate3d'`     | Flat rotation, full 3D rotation, or a burst that turns to follow the cursor. |
| `zoom`              | `number`                                         | `1`              | How close the burst is. Higher values zoom in.                               |
| `ray-width`         | `number`                                         | `1`              | Thickness of the rays, from thin threads to broad beams.                     |
| `ray-count`         | `number`                                         | `0`              | Splits the light into this many evenly spaced spokes. 0 keeps it organic.    |
| `distort`           | `number`                                         | `0`              | Bends the rays into flowing, organic shapes.                                 |
| `twist`             | `number`                                         | `0`              | Swirls the rays into a spiral. Negative values turn the other way.           |
| `flow`              | `number`                                         | `0`              | Streams the colors through the burst. Negative values reverse it.            |
| `center-fade`       | `number`                                         | `1`              | Size of the dark core at the heart of the burst, 0.5 to 3.                   |
| `glow`              | `number`                                         | `0`              | Soft bloom around the brightest rays.                                        |
| `grain`             | `number`                                         | `0.8`            | Film grain over the light, 0.3 to 1.                                         |
| `offset`            | `{ x?: number \| string; y?: number \| string }` | `{ x: 0, y: 0 }` | Moves the center of the burst, in pixels. Positive y moves it up.            |
| `mouse-interaction` | `boolean`                                        | `true`           | The burst leans toward the cursor and the rays near it brighten.             |
| `mouse-strength`    | `number`                                         | `0.5`            | How strongly the burst reacts to the cursor.                                 |
| `hover-dampness`    | `number`                                         | `0.25`           | How smoothly the burst follows the cursor, 0 to 1. Higher feels heavier.     |
| `click-burst`       | `boolean`                                        | `true`           | Clicking sends a wave of light racing out along the rays.                    |
| `intro`             | `boolean`                                        | `true`           | The burst ignites from the center when it mounts.                            |
| `fade`              | `number`                                         | `0`              | Fades the edges into the page, 0 to 1.                                       |
| `quality`           | `'low' \| 'medium' \| 'high'`                    | `'high'`         | Render resolution. Lower settings are lighter on slower devices.             |
| `resolution`        | `number`                                         | `undefined`      | Exact render scale from 0.2 to 1. Overrides `quality`.                       |
| `light-mode`        | `boolean`                                        | `false`          | Draws the burst as colored ink on a white background.                        |
| `mix-blend-mode`    | `CSSProperties['mixBlendMode']`                  | `undefined`      | CSS blend mode for the canvas, such as `screen` or `lighten`.                |
| `paused`            | `boolean`                                        | `false`          | Freezes the animation.                                                       |
| `dpr`               | `number`                                         | auto             | Maximum device pixel ratio, capped at 2.                                     |
| `class`             | `string`                                         | `''`             | Extra classes for the container.                                             |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the burst renders a still frame: no intro, no rotation, no cursor lean and no click waves.
- Pointer tracking is passive and never blocks scrolling or clicks on content above the burst.

- Ported from [React Bits](https://reactbits.dev/backgrounds/prismatic-burst) by David Haz.
