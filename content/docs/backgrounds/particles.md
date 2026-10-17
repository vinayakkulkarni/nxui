---
title: Particles
description: A drifting 3D field of particles with glow, twinkle, constellation lines and cursor interaction.
---

A 3D cloud of particles drawn with instanced raw WebGL2, so it stays crisp and fast with thousands of points. The field flies in from the distance, floats and slowly turns, and each particle can glow and twinkle. Move the cursor to tilt the field with parallax, or switch `hover-effect` to push particles away or pull them in. Click to send a burst of light rippling through them. Particles can be circles, squares, rings or sparkles, drift up like embers, down like snow or toward you like a starfield, blur into bokeh near the lens, and join into constellation lines. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-particles
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/particles.json"
```

## Usage

```vue
<script setup lang="ts">
  import Particles from '~/components/ui/particles/Particles.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Particles
      :particle-colors="['#ffffff']"
      :particle-count="200"
      :particle-spread="10"
      :speed="0.1"
      :particle-base-size="100"
      :glow="0.5"
      :twinkle="0.3"
      hover-effect="parallax"
      :click-burst="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `particlesPreset('fireflies')` returns the props of the Classic, Constellation, Bokeh, Fireflies, Snow, Warp or Stardust preset.

## Props

| Prop                      | Type                                          | Default       | Description                                                                                  |
| ------------------------- | --------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `particle-count`          | `number`                                      | `200`         | How many particles there are (up to 20,000).                                                 |
| `particle-spread`         | `number`                                      | `10`          | How far the particles spread out from the center.                                            |
| `speed`                   | `number`                                      | `0.1`         | Speed of the floating motion, twinkle and rotation.                                          |
| `particle-colors`         | `string[]`                                    | `['#ffffff']` | Colors the particles are picked from.                                                        |
| `particle-base-size`      | `number`                                      | `100`         | Base size of the particles. Nearer particles are drawn larger.                               |
| `size-randomness`         | `number`                                      | `1`           | How much particle sizes vary. `0` draws every particle at the base size in px.               |
| `shape`                   | `'circle' \| 'square' \| 'ring' \| 'sparkle'` | `'circle'`    | Shape of each particle.                                                                      |
| `glow`                    | `number`                                      | `0.5`         | Soft glow around each particle.                                                              |
| `twinkle`                 | `number`                                      | `0.3`         | How much the particles flicker, from 0 to 1.                                                 |
| `depth-of-field`          | `number`                                      | `0`           | Blurs the nearest particles into soft bokeh, like a camera lens.                             |
| `connections`             | `boolean`                                     | `false`       | Joins nearby particles with thin lines, like a constellation.                                |
| `connection-distance`     | `number`                                      | `110`         | How close particles need to be to connect, in px.                                            |
| `drift`                   | `'none' \| 'up' \| 'down' \| 'forward'`       | `'none'`      | Sends the particles drifting up like embers, down like snow, or toward you like a starfield. |
| `drift-speed`             | `number`                                      | `1`           | How fast the particles drift.                                                                |
| `move-particles-on-hover` | `boolean`                                     | `true`        | Lets the cursor move the particles.                                                          |
| `hover-effect`            | `'parallax' \| 'repel' \| 'attract'`          | `'parallax'`  | What the cursor does: tilt the whole field, push particles away, or pull them in.            |
| `particle-hover-factor`   | `number`                                      | `1`           | Strength of the hover effect.                                                                |
| `hover-radius`            | `number`                                      | `140`         | Radius around the cursor that repel and attract reach, in px.                                |
| `click-burst`             | `boolean`                                     | `true`        | Clicking sends a burst of light rippling through the particles.                              |
| `alpha-particles`         | `boolean`                                     | `false`       | Draws softer, slightly see-through particles.                                                |
| `camera-distance`         | `number`                                      | `20`          | Distance from the camera to the particles. Lower values feel closer and deeper.              |
| `disable-rotation`        | `boolean`                                     | `false`       | Stops the slow rotation of the whole field.                                                  |
| `variation`               | `number`                                      | `0`           | Picks a different particle layout.                                                           |
| `intro`                   | `boolean`                                     | `true`        | Flies the particles in from the distance on mount.                                           |
| `opacity`                 | `number`                                      | `1`           | Opacity of the whole effect.                                                                 |
| `light-mode`              | `boolean`                                     | `false`       | Draws the particles as ink for light backgrounds.                                            |
| `paused`                  | `boolean`                                     | `false`       | Freezes the animation.                                                                       |
| `pixel-ratio`             | `number`                                      | auto          | Maximum device pixel ratio. Defaults to the screen's, capped at 2.                           |
| `class`                   | `string`                                      | `''`          | Extra classes merged on the container.                                                       |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- Pointer listeners are passive and sit on `window`, so the field never takes focus or blocks clicks on content above it.
- With `prefers-reduced-motion: reduce` there is no intro, no floating, drift, cursor effect or click burst. The field is drawn and holds still.
- The render loop stops when the field is paused, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/particles) by David Haz.
