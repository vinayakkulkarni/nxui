---
title: Antigravity
description: A field of particles that lifts into a glowing ring around the cursor and bursts outward on click.
---

A field of crisp, colorful particles drawn on raw WebGL2. Particles near the cursor lift off and swirl into a rippling ring on springy motion, and they stretch into streaks when they move fast. Move the cursor to drag the ring around, hold to pull it in and spin it faster, then release to burst the particles outward. When the cursor rests, the ring drifts on its own.

::demo-antigravity
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/antigravity.json"
```

## Usage

```vue
<script setup lang="ts">
  import Antigravity from '~/components/ui/antigravity/Antigravity.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-zinc-950">
    <Antigravity
      :colors="['#5227FF', '#FF9FFC', '#B497CF']"
      color-mode="conic"
      particle-shape="capsule"
      :count="1500"
      :magnet-radius="9"
      :ring-radius="7"
    />
  </div>
</template>
```

On a light page, set `light-mode` so pale colors are deepened and stay visible. Rendering stops while the field is scrolled out of view and while the tab is hidden.

## Props

| Prop                     | Type                                              | Default                             | Description                                                                                |
| ------------------------ | ------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `count`                  | `number`                                          | `1500`                              | Number of particles in the field.                                                          |
| `magnet-radius`          | `number`                                          | `9`                                 | Size of the area around the cursor whose particles get pulled into the ring.               |
| `ring-radius`            | `number`                                          | `7`                                 | Radius of the ring the particles form.                                                     |
| `wave-speed`             | `number`                                          | `0.4`                               | How fast the ripples travel around the ring.                                               |
| `wave-amplitude`         | `number`                                          | `1`                                 | How much the ring ripples. 0 gives a clean circle.                                         |
| `wave-count`             | `number`                                          | `3`                                 | Number of ripples around the ring. Pair with a high `wave-amplitude` for a flower shape.   |
| `particle-size`          | `number`                                          | `0.9`                               | Size of the particles.                                                                     |
| `lerp-speed`             | `number`                                          | `0.05`                              | How quickly the particles follow the cursor. Lower values leave longer trails.             |
| `color`                  | `string`                                          | `undefined`                         | A single color for every particle. Overrides `colors` when set.                            |
| `colors`                 | `string[]`                                        | `['#5227FF', '#FF9FFC', '#B497CF']` | Palette the particles are colored from. How it is spread depends on `color-mode`.          |
| `color-mode`             | `'conic' \| 'radial' \| 'random'`                 | `'conic'`                           | Spreads the palette around the cursor, outward from the ring, or randomly per particle.    |
| `color-speed`            | `number`                                          | `0.05`                              | How fast the conic palette turns around the cursor. 0 keeps it still.                      |
| `auto-animate`           | `boolean`                                         | `true`                              | The ring drifts on its own after a couple of seconds without cursor movement.              |
| `particle-variance`      | `number`                                          | `1`                                 | How much each particle pulses in size, from 0 to 1.                                        |
| `rotation-speed`         | `number`                                          | `0`                                 | How fast the particles orbit the cursor. Negative values orbit the other way.              |
| `depth-factor`           | `number`                                          | `1`                                 | Strength of the 3D depth. Particles in front grow, particles behind shrink and soften.     |
| `pulse-speed`            | `number`                                          | `3`                                 | How fast the particles pulse in size.                                                      |
| `particle-shape`         | `'capsule' \| 'sphere' \| 'box' \| 'tetrahedron'` | `'capsule'`                         | Shape of the particles. Capsules stretch into dashes that point at the cursor.             |
| `field-strength`         | `number`                                          | `10`                                | How tightly the particles line up on the ring. Lower values spread them into a wider band. |
| `ambient`                | `number`                                          | `0.25`                              | How visible the particles away from the ring are, from 0 to 1.                             |
| `interactive`            | `boolean`                                         | `true`                              | The ring follows the cursor or finger. Turn off for a purely ambient background.           |
| `click-burst`            | `boolean`                                         | `true`                              | Pressing pulls the ring in and spins it faster. Releasing blasts the particles outward.    |
| `intro`                  | `boolean`                                         | `true`                              | The particles float up into place on mount.                                                |
| `light-mode`             | `boolean`                                         | `false`                             | Deepens pale colors so the particles stay visible on light backgrounds.                    |
| `opacity`                | `number`                                          | `1`                                 | Overall opacity, from 0 to 1.                                                              |
| `max-device-pixel-ratio` | `number`                                          | `2`                                 | Highest pixel ratio the canvas renders at.                                                 |
| `class`                  | `string`                                          | `''`                                | Extra classes for the container.                                                           |

## Accessibility

- The canvas is `aria-hidden`. Put real content on top of it in your own markup.
- Pointer input is read from `window`, so content layered on top stays fully interactive while the cursor still moves the ring.
- With `prefers-reduced-motion: reduce` the field moves at 30% speed, the auto drift, intro and click burst are turned off.

- Ported from [React Bits](https://reactbits.dev/backgrounds/antigravity) by David Haz.
