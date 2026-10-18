---
title: Laser Flow
description: A beam of light that splashes onto your content, spreads along its top edge and pours over its corners.
---

# Laser Flow

A waterfall of light rendered with one WebGL2 shader. The beam drops in on mount, lands on the element you pass as `surface-ref`, runs along its top edge and spills over both corners. Smoke, dust and fine streaks flow with the light. Move the cursor over it to brighten the light around the pointer and reveal an image of your UI through the glow. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-laser-flow
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/laser-flow.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import LaserFlow from '~/components/ui/laser-flow/LaserFlow.vue';

  const card = ref<HTMLElement | null>(null);
</script>

<template>
  <div class="relative h-125 overflow-hidden bg-black">
    <LaserFlow
      class="absolute inset-0"
      :surface-ref="card"
      color="#3847ff"
      :beam-position="0.6"
      reveal-image="/ui-outline.svg"
    />
    <div
      ref="card"
      class="absolute inset-x-[4%] top-[55%] -bottom-6 rounded-[14px] border bg-card"
    >
      <!-- your UI -->
    </div>
  </div>
</template>
```

Without `surface-ref` the beam lands on an invisible floor at `surface-level`. The surface's top corner radius is read from its computed style, so the light follows rounded corners. If the beam falls outside the surface, it lands on the floor instead.

## Props

| Prop                | Type                  | Default     | Description                                                                                  |
| ------------------- | --------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `surface-ref`       | `HTMLElement \| null` | `null`      | Element the beam lands on. The light spreads along its top edge and spills over its corners. |
| `beam-position`     | `number`              | `0.6`       | Horizontal position of the beam, from 0 (left edge) to 1 (right edge).                       |
| `surface-level`     | `number`              | `1`         | Where the beam lands when no `surface-ref` is given, from 0 (top) to 1 (bottom).             |
| `color`             | `string`              | `'#3847ff'` | Color of the light. Every other tone is derived from it.                                     |
| `intensity`         | `number`              | `1.8`       | Overall brightness of the light.                                                             |
| `beam-width`        | `number`              | `1.5`       | Thickness of the beam and its glow.                                                          |
| `flare`             | `number`              | `1.5`       | Size of the splash where the beam meets the surface.                                         |
| `spread`            | `number`              | `1.5`       | How far the light travels along the surface.                                                 |
| `spill`             | `number`              | `1`         | How much light pours over the corners of the surface.                                        |
| `fog`               | `number`              | `0.2`       | Amount of smoke lit up by the beam. 0 turns it off.                                          |
| `dust`              | `number`              | `1.6`       | Amount of glittering dust flowing with the light.                                            |
| `streaks`           | `number`              | `1.5`       | Brightness of the fine lines flowing along the splash.                                       |
| `dots`              | `number`              | `1`         | Strength of the fine dot texture in the glow.                                                |
| `pulse`             | `number`              | `1.5`       | How much the splash breathes over time.                                                      |
| `speed`             | `number`              | `1.5`       | Animation speed. 0 holds the light still.                                                    |
| `seed`              | `number`              | `3`         | Changes the shape of the smoke.                                                              |
| `mouse-interaction` | `boolean`             | `true`      | Brightens the light, smoke and dust softly around the cursor.                                |
| `reveal-image`      | `string`              | —           | Image revealed through the light around the cursor, such as a screenshot of your UI.         |
| `reveal-radius`     | `number`              | `220`       | Radius of the reveal around the cursor, in pixels.                                           |
| `reveal-opacity`    | `number`              | `0.6`       | Strength of the revealed image. 0 hides it.                                                  |
| `intro`             | `boolean`             | `true`      | Drops the beam in and lets the light run along the surface on mount.                         |
| `theme`             | `'dark' \| 'light'`   | `'dark'`    | Use `light` on light page backgrounds.                                                       |
| `paused`            | `boolean`             | `false`     | Freezes the animation.                                                                       |
| `dpr`               | `number`              | auto        | Maximum device pixel ratio, capped at 2.                                                     |
| `class`             | `string`              | `''`        | Extra classes for the container.                                                             |

## Accessibility

- The canvas is decorative (`aria-hidden`) and the container ignores pointer events, so content under and around it stays clickable.
- With `prefers-reduced-motion: reduce` the intro is skipped, the light holds still and the cursor glow is off.
- The render loop stops when the canvas is offscreen or the tab is hidden, and idles once the light has settled while `paused`.
- The cross-origin `reveal-image` must allow CORS, since it is uploaded to WebGL.

- Ported from [React Bits](https://reactbits.dev/animations/laser-flow) by David Haz.
