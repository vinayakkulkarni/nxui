---
title: Gradient Blinds
description: Satin gradient blinds lit by a spotlight that follows the cursor, swaying and turning toward the light.
---

Gradient blinds drawn in one raw WebGL2 pass. A spotlight follows the cursor on a soft spring and the blinds near it turn toward the light. When the cursor leaves, the light drifts on its own while the blinds sway as if in a breeze. Click to send a wave of light through the blinds, slat to slat.

::demo-gradient-blinds
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gradient-blinds.json"
```

## Usage

```vue
<script setup lang="ts">
  import GradientBlinds from '~/components/ui/gradient-blinds/GradientBlinds.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <GradientBlinds
      :gradient-colors="['#FF9FFC', '#5227FF']"
      :angle="20"
      :blind-count="16"
      :blind-min-width="60"
      :shine="0.4"
      :relief="0.5"
      :sway="0.35"
      click-effect="ripple"
      idle="drift"
    />
  </div>
</template>
```

Pass `light-mode` on a white page. The blinds are then drawn as colored light on white, and `mix-blend-mode` is not applied.

## Props

| Prop                 | Type                            | Default                  | Description                                                                     |
| -------------------- | ------------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| `gradient-colors`    | `string[]`                      | `['#FF9FFC', '#5227FF']` | Colors of the gradient across the blinds, up to 8. One color fills every blind. |
| `angle`              | `number`                        | `0`                      | Rotation of the blinds in degrees. 0 stands them upright.                       |
| `blind-count`        | `number`                        | `16`                     | Number of blinds. Acts as an upper limit when `blind-min-width` is set.         |
| `blind-min-width`    | `number`                        | `60`                     | Narrowest a blind can get, in px. Small screens draw fewer blinds.              |
| `shine-direction`    | `'left' \| 'right'`             | `'left'`                 | Which edge of each blind catches the light.                                     |
| `light-color`        | `string`                        | `'#ffffff'`              | Color of the light that falls on the blinds.                                    |
| `spotlight-radius`   | `number`                        | `0.5`                    | Size of the light around the cursor, relative to the area.                      |
| `spotlight-softness` | `number`                        | `1`                      | How the light fades toward its edge. Higher stays bright longer.                |
| `spotlight-opacity`  | `number`                        | `1`                      | Strength of the light.                                                          |
| `shine`              | `number`                        | `0.4`                    | Highlight along the lit edge of each blind, from 0 (matte) to 1.                |
| `relief`             | `number`                        | `0.5`                    | Shadow depth where each blind tucks under the next, from 0 (flat) to 1.         |
| `glow`               | `number`                        | `0.4`                    | Haze of colored light around the cursor.                                        |
| `sway`               | `number`                        | `0.35`                   | How much the blinds drift and turn on their own.                                |
| `speed`              | `number`                        | `1`                      | Speed of the sway and of the drifting light.                                    |
| `hover-tilt`         | `number`                        | `0.6`                    | How much the blinds near the cursor turn toward the light, from 0 to 1.         |
| `click-effect`       | `'ripple' \| 'none'`            | `'ripple'`               | Clicking sends a wave of light outward through the blinds.                      |
| `idle`               | `'drift' \| 'center' \| 'stay'` | `'drift'`                | What the light does while the cursor is away.                                   |
| `perspective`        | `number`                        | `0`                      | Makes the blinds recede to one side, from -1 to 1.                              |
| `gradient-speed`     | `number`                        | `0`                      | Drifts the colors across the blinds over time. 0 keeps them still.              |
| `mirror-gradient`    | `boolean`                       | `false`                  | Runs the gradient forward and back again.                                       |
| `distort-amount`     | `number`                        | `0`                      | Bends the blinds into soft waves.                                               |
| `noise`              | `number`                        | `0.3`                    | Film grain strength, from 0 (clean) to 1.                                       |
| `mouse-dampening`    | `number`                        | `0.15`                   | Seconds the light takes to catch up with the cursor. 0 follows instantly.       |
| `intro`              | `boolean`                       | `true`                   | Fades the light in while the blinds turn into place on mount.                   |
| `paused`             | `boolean`                       | `false`                  | Freezes the current frame.                                                      |
| `mix-blend-mode`     | `CSSProperties['mixBlendMode']` | `'lighten'`              | Blend mode over the page in dark mode, so dark areas show the page behind.      |
| `light-mode`         | `boolean`                       | `false`                  | Draws the blinds as colored light on a white page.                              |
| `dpr`                | `number`                        | auto                     | Maximum device pixel ratio, capped at 2.                                        |
| `class`              | `string`                        | `''`                     | Extra classes for the container.                                                |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the blinds hold still: no intro, no sway, no drifting light and no click waves. The light still follows the cursor.
- Pointer tracking is passive and never blocks scrolling or clicks on content above the blinds.
- Animation stops when the blinds are offscreen, the tab is hidden, or nothing is moving.

- Ported from [React Bits](https://reactbits.dev/backgrounds/gradient-blinds) by David Haz.
