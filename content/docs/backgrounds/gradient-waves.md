---
title: GradientWaves
description: Lit satin waves rolling in from a hazy horizon, with a light that follows the cursor and swells on click.
---

A ray-marched WebGL2 sea of soft gradient waves that fade into a colored haze at the horizon. The waves rise from calm water on load, the light and the view turn gently toward the cursor, and a click sends a swell rolling in from that point.

::demo-gradient-waves
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gradient-waves.json"
```

## Usage

```vue
<script setup lang="ts">
  import GradientWaves from '~/components/ui/gradient-waves/GradientWaves.vue';
</script>

<template>
  <div class="relative h-125 w-full">
    <GradientWaves
      horizon-color="#5227FF"
      wave-color="#FF9FFC"
      crest-color="#FFFFFF"
    />
  </div>
</template>
```

## Props

| Prop                | Type                          | Default         | Description                                                                                           |
| ------------------- | ----------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `horizon-color`     | `string`                      | `'#5227FF'`     | Haze the waves fade into toward the horizon, and the tint of their shadows.                           |
| `wave-color`        | `string`                      | `'#FF9FFC'`     | Main color of the wave bodies.                                                                        |
| `crest-color`       | `string`                      | `'#FFFFFF'`     | Color of the crests and the light they catch.                                                         |
| `background-color`  | `string`                      | `'transparent'` | Fills the canvas behind the waves. Transparent lets the page show through.                            |
| `light-mode`        | `boolean`                     | `false`         | Draws the waves as soft colored ink for light pages.                                                  |
| `speed`             | `number`                      | `0.4`           | How fast the waves roll in.                                                                           |
| `amplitude`         | `number`                      | `2.5`           | Height of the waves.                                                                                  |
| `wave-scale`        | `number`                      | `0.6`           | How many waves fit in view. Higher is choppier.                                                       |
| `wave-ratio`        | `number`                      | `0.9`           | Balance between the long rolling waves and the shorter cross waves.                                   |
| `swell`             | `number`                      | `35`            | How much the long waves bend and meander.                                                             |
| `turbulence`        | `number`                      | `20`            | How much the cross waves wander.                                                                      |
| `tilt`              | `number`                      | `64`            | Camera angle in degrees, from looking down to facing the horizon.                                     |
| `zoom`              | `number`                      | `1`             | Field of view. Higher zooms in.                                                                       |
| `height`            | `number`                      | `5.5`           | Water level. Higher brings the waves closer.                                                          |
| `fog-depth`         | `number`                      | `15`            | How far you can see before the waves fade out.                                                        |
| `relief`            | `number`                      | `1`             | Depth of the light and shadow on the waves. 0 gives flat gradient waves.                              |
| `light-angle`       | `number`                      | `120`           | Direction the light comes from, in degrees. 0 lights the waves from behind you, 180 from the horizon. |
| `sheen`             | `number`                      | `0`             | Strength of a soft highlight on the crests.                                                           |
| `brightness`        | `number`                      | `1`             | Overall brightness.                                                                                   |
| `opacity`           | `number`                      | `1`             | Opacity of the whole effect.                                                                          |
| `grain`             | `number \| boolean`           | `0.2`           | Film grain on the waves, up to 0.5. 0 turns it off.                                                   |
| `quality`           | `'low' \| 'medium' \| 'high'` | `'medium'`      | Rendering precision. Lower is faster on weak devices.                                                 |
| `intro`             | `boolean`                     | `true`          | Starts from calm water and lets the waves rise from the horizon toward you.                           |
| `mouse-interaction` | `boolean`                     | `true`          | The light follows the cursor across the waves and the view turns gently toward it.                    |
| `parallax-strength` | `number`                      | `0.5`           | How far the view turns toward the cursor.                                                             |
| `mouse-strength`    | `number`                      | `0.6`           | How far the light turns to follow the cursor.                                                         |
| `swell-on-click`    | `boolean`                     | `true`          | Clicking sends a swell rolling in from that point.                                                    |
| `paused`            | `boolean`                     | `false`         | Freezes the waves.                                                                                    |
| `dpr`               | `number`                      | `2`             | Maximum device pixel ratio of the canvas.                                                             |
| `class`             | `string`                      | `''`            | Additional CSS classes for the container.                                                             |

## Accessibility

The canvas is decorative and hidden from assistive technology (`aria-hidden`). With `prefers-reduced-motion: reduce` the waves hold still, the intro is skipped, and the cursor and click effects are off. Clicks on links, buttons and form fields placed over the background never start a swell. The render loop stops when the component is offscreen or the tab is hidden, and goes idle when nothing is moving.

- Ported from [React Bits](https://reactbits.dev/backgrounds/gradient-waves) by David Haz.
