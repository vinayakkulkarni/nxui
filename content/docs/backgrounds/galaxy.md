---
title: Galaxy
description: An endless flight through a twinkling starfield with warp jumps, cursor repulsion and star palettes.
---

An endless flight through layers of twinkling stars, drawn in one raw WebGL2 shader with no extra dependencies. It arrives from hyperspace on mount, then keeps gliding forward while the field slowly turns. Move the cursor and the stars glide out of its way; click to jump to warp speed and watch the stars stretch into streaks. Stars can take a hue-shifted color or come from a palette of up to four colors, the brightest ones carry cross flares, and light mode draws them as ink on paper. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-galaxy
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/galaxy.json"
```

## Usage

```vue
<script setup lang="ts">
  import Galaxy from '~/components/ui/galaxy/Galaxy.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Galaxy
      :density="1"
      :glow-intensity="0.3"
      :star-speed="0.5"
      :hue-shift="140"
      :twinkle-intensity="0.3"
      :rotation-speed="0.1"
      :mouse-repulsion="true"
      :repulsion-strength="2"
      :click-warp="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `galaxyPreset('hyperdrive')` returns the props of the Classic, Stardust, Hyperdrive, Sparkle, Drift or Cluster preset, and `GALAXY_PALETTES` holds the Stardust, Ice, Gold and Rose star colors.

## Props

| Prop                    | Type                      | Default      | Description                                                                                  |
| ----------------------- | ------------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `star-colors`           | `string[]`                | —            | Up to four colors the stars are picked from. Replaces the hue shift and saturation coloring. |
| `hue-shift`             | `number`                  | `140`        | Shifts the hue of the stars, in degrees.                                                     |
| `saturation`            | `number`                  | `0`          | Color saturation of the stars, from 0 to 1.                                                  |
| `density`               | `number`                  | `1`          | How densely the stars are packed.                                                            |
| `glow-intensity`        | `number`                  | `0.3`        | Brightness of the glow around each star.                                                     |
| `star-size`             | `number`                  | `1`          | Size of each star glow.                                                                      |
| `flare-intensity`       | `number`                  | `1`          | Strength of the cross flares on the brightest stars.                                         |
| `twinkle-intensity`     | `number`                  | `0.3`        | How much the stars twinkle, from 0 to 1.                                                     |
| `star-speed`            | `number`                  | `0.5`        | How fast you travel through the stars.                                                       |
| `speed`                 | `number`                  | `1`          | Overall speed of the animation.                                                              |
| `rotation-speed`        | `number`                  | `0.1`        | How fast the starfield rotates.                                                              |
| `layers`                | `number`                  | `4`          | Number of star layers, from 2 to 8.                                                          |
| `direction`             | `'forward' \| 'backward'` | `'forward'`  | Whether you fly into the stars or drift back out of them.                                    |
| `mouse-interaction`     | `boolean`                 | `true`       | Lets the cursor interact with the stars.                                                     |
| `mouse-repulsion`       | `boolean`                 | `true`       | Pushes the stars away from the cursor. When off, the field shifts with the cursor instead.   |
| `repulsion-strength`    | `number`                  | `2`          | Strength of the push away from the cursor.                                                   |
| `auto-center-repulsion` | `number`                  | `0`          | Pushes the stars away from the center without the cursor. `0` turns it off.                  |
| `click-warp`            | `boolean`                 | `true`       | Clicking jumps forward at warp speed.                                                        |
| `intro`                 | `boolean`                 | `true`       | Drops out of warp speed on mount.                                                            |
| `focal`                 | `[number, number]`        | `[0.5, 0.5]` | Center of the starfield, from 0 to 1.                                                        |
| `rotation`              | `[number, number]`        | `[1, 0]`     | Fixed rotation of the starfield as a `[cos, sin]` pair.                                      |
| `transparent`           | `boolean`                 | `true`       | Shows the page behind the stars. When off, the stars sit on the background color.            |
| `background-color`      | `string`                  | `'#000000'`  | Background behind the stars when `transparent` is off, or the paper color in light mode.     |
| `light-mode`            | `boolean`                 | `false`      | Draws the stars as ink for light backgrounds.                                                |
| `opacity`               | `number`                  | `1`          | Opacity of the whole effect.                                                                 |
| `disable-animation`     | `boolean`                 | `false`      | Freezes the animation.                                                                       |
| `dpr`                   | `number`                  | auto         | Maximum device pixel ratio, capped at 2.                                                     |
| `class`                 | `string`                  | `''`         | Extra classes merged on the container.                                                       |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- Pointer listeners are passive and sit on `window`, so the starfield never takes focus or blocks clicks on content above it.
- With `prefers-reduced-motion: reduce` there is no intro, flight, rotation, cursor effect or warp jump. The stars are drawn and hold still.
- The render loop stops when the animation is frozen and idle, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/galaxy) by David Haz.
