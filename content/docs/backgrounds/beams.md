---
title: Beams
description: Glossy ribbons that ripple in the dark and catch the light, which follows your cursor.
---

Rows of glossy ribbons ripple slowly, and every ripple catches a bright, glowing glint. Move the cursor over the effect and the light slides along the beams with it, brightening the glints near the pointer. On mount the light sweeps in from below. Raw WebGL2, no 3D library.

::demo-beams
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/beams.json"
```

## Usage

```vue
<script setup lang="ts">
  import Beams from '~/components/ui/beams/Beams.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-black">
    <Beams color="#ff8a4c" :rotation="20" :glow="0.85" :fill-light="0.2" />
  </div>
</template>
```

The canvas is transparent, so the page shows through. Use `background-color` for a solid backdrop, and `light-mode` on light pages: the glints print as soft ink instead of light. `beamsPreset('studio' | 'ember' | 'glacier' | 'chrome' | 'dawn')` returns a ready-made look you can spread onto the component with `v-bind`.

## Props

| Prop                | Type      | Default     | Description                                                                        |
| ------------------- | --------- | ----------- | ---------------------------------------------------------------------------------- |
| `color`             | `string`  | `'#ffffff'` | Color of the light that glints off the beams. Any CSS color.                       |
| `beam-width`        | `number`  | `140`       | Width of each beam, in px.                                                         |
| `rotation`          | `number`  | `30`        | Angle of the beams, in degrees.                                                    |
| `speed`             | `number`  | `1`         | How fast the ripples move.                                                         |
| `wave-length`       | `number`  | `233`       | Length of the ripples along each beam, in px.                                      |
| `depth`             | `number`  | `1`         | How deep the ripples are. Deeper ripples catch the light in more places.           |
| `sharpness`         | `number`  | `0.6`       | How crisp the glints are, from 0 for soft satin to 1 for sharp, glossy streaks.    |
| `twist`             | `number`  | `0`         | Turns each beam slightly on its own axis, so glints show up on more beams.         |
| `fill-light`        | `number`  | `0.3`       | Strength of a dimmer second light from the other side, for fuller, metallic beams. |
| `brightness`        | `number`  | `1.6`       | Strength of the light.                                                             |
| `glow`              | `number`  | `0.6`       | Soft glow around the brightest glints.                                             |
| `grain`             | `number`  | `0.35`      | Strength of the film grain, from 0 to 1.                                           |
| `variation`         | `number`  | `0`         | Picks a different ripple pattern. Any number works.                                |
| `mouse-interaction` | `boolean` | `true`      | The cursor moves the light along the beams and brightens the glints near it.       |
| `mouse-strength`    | `number`  | `1`         | How strongly the cursor moves the light.                                           |
| `intro`             | `boolean` | `true`      | Sweeps the light in on mount.                                                      |
| `fade`              | `number`  | `0`         | Fades the edges into the page, from 0 to 1.                                        |
| `opacity`           | `number`  | `1`         | Opacity of the whole effect.                                                       |
| `light-mode`        | `boolean` | `false`     | Prints the glints as soft ink, for light backgrounds.                              |
| `background-color`  | `string`  | `undefined` | Optional solid background. By default the canvas is transparent.                   |
| `quality`           | `number`  | `0.75`      | Render resolution, from 0.25 to 1. Lower values run faster.                        |
| `paused`            | `boolean` | `false`     | Freezes the animation.                                                             |
| `dpr`               | `number`  | auto        | Maximum device pixel ratio, capped at 2.                                           |
| `class`             | `string`  | `''`        | Extra classes for the container.                                                   |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the ripples hold still, the intro sweep is skipped and the cursor no longer moves the light.
- Rendering stops while the effect is off screen or the tab is hidden, and the loop sleeps when nothing moves (`paused`).

- Ported from [React Bits](https://reactbits.dev/backgrounds/beams) by David Haz.
