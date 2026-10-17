---
title: Plasma Wave
description: Two ribbons of plasma curling through each other, with soft glow and white-hot cores.
---

Two raymarched ribbons of plasma curl through each other with a soft glow and white-hot cores. The plasma unfolds and fades in on mount, and moving the cursor along it makes it swell and brighten under the pointer.

::demo-plasma-wave
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/plasma-wave.json"
```

## Usage

```vue
<script setup lang="ts">
  import PlasmaWave from '~/components/ui/plasma-wave/PlasmaWave.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-black">
    <PlasmaWave
      :colors="['#A855F7', '#06B6D4']"
      :speed="1"
      :bend-1="1"
      :bend-2="0.5"
      :core="0.6"
    />
  </div>
</template>
```

The plasma renders into a transparent WebGL2 canvas, so the container's
background shows through. Set `light-mode` on light pages: the plasma is then
drawn as glowing glass with white cores. Use darker, more saturated colors
there (for example `['#8B2CFF', '#00CFF5']`).

## Props

| Prop                | Type       | Default                  | Description                                                               |
| ------------------- | ---------- | ------------------------ | ------------------------------------------------------------------------- |
| `colors`            | `string[]` | `['#A855F7', '#06B6D4']` | Colors of the two waves of plasma.                                        |
| `speed`             | `number`   | `1`                      | Overall speed of the animation.                                           |
| `speed-1`           | `number`   | `0.05`                   | How fast the first wave travels.                                          |
| `speed-2`           | `number`   | `0.05`                   | How fast the second wave travels.                                         |
| `dir-2`             | `number`   | `1`                      | Direction of the second wave. Use -1 to make it travel against the first. |
| `bend-1`            | `number`   | `1`                      | How far the first wave curls around its path.                             |
| `bend-2`            | `number`   | `0.5`                    | How far the second wave curls around its path.                            |
| `thickness`         | `number`   | `0.3`                    | Thickness of the plasma ribbons.                                          |
| `focal-length`      | `number`   | `1.25`                   | Camera lens. Lower values give a wider, deeper view.                      |
| `rotation-deg`      | `number`   | `0`                      | Rotation of the whole effect, in degrees.                                 |
| `x-offset`          | `number`   | `0`                      | Horizontal shift of the view, in px.                                      |
| `y-offset`          | `number`   | `0`                      | Vertical shift of the view, in px.                                        |
| `brightness`        | `number`   | `1`                      | Brightness of the plasma.                                                 |
| `glow`              | `number`   | `1`                      | Strength of the soft light spilling around the plasma.                    |
| `core`              | `number`   | `0.6`                    | How white-hot the brightest parts get, from 0 to 1.                       |
| `grain`             | `number`   | `0.03`                   | Strength of the film grain.                                               |
| `quality`           | `number`   | `1`                      | Detail of the plasma, from 0.25 to 1. Lower values render faster.         |
| `mouse-interaction` | `boolean`  | `true`                   | Swells and brightens the plasma near the cursor.                          |
| `intro`             | `boolean`  | `true`                   | Unfolds the plasma and fades it in on mount.                              |
| `fade`              | `number`   | `0`                      | Fades the edges into the page, from 0 to 1.                               |
| `opacity`           | `number`   | `1`                      | Opacity of the whole effect.                                              |
| `light-mode`        | `boolean`  | `false`                  | Draws the plasma as glowing glass with white cores for light pages.       |
| `paused`            | `boolean`  | `false`                  | Freezes the animation.                                                    |
| `dpr`               | `number`   | auto                     | Maximum device pixel ratio, capped at 2.                                  |
| `class`             | `string`   | `''`                     | Extra classes for the container.                                          |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`.
- With `prefers-reduced-motion: reduce` the plasma holds still, the intro is
  skipped and the cursor does not stir it.
- The render loop pauses when the canvas is off screen or the tab is hidden,
  and stops once the plasma has settled while `paused` is set.

- Ported from [React Bits](https://reactbits.dev/backgrounds/plasma-wave) by David Haz.
