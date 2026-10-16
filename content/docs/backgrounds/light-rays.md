---
title: Light Rays
description: Volumetric light rays from any edge, with a glowing source and drifting haze. The cursor steers the beam, casts a shadow and clicks send a wave of light.
---

# Light Rays

Volumetric shafts of light pour in from any edge or corner, with a soft glow at the source and a slow haze drifting through the beam. The light cools toward blue as it travels. Move the pointer and the beam turns toward it while your cursor casts a soft shadow down the rays. Click anywhere over it to send a wave of light down the beam. The rays grow out from the source on mount, and `light-mode` prints the light as colored ink so it sits on pale pages. It renders on raw WebGL2 with a pixel budget, so it stays cheap on large screens.

::demo-light-rays
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/light-rays.json"
```

## Usage

```vue
<script setup lang="ts">
  import LightRays from '~/components/ui/light-rays/LightRays.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <LightRays
      rays-origin="top-center"
      rays-color="#ffffff"
      :light-spread="0.5"
      :ray-length="3"
      :haze="0.25"
    />
  </div>
</template>
```

## Props

| Prop                     | Type         | Default        | Description                                                                                                                         |
| ------------------------ | ------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `rays-origin`            | `RaysOrigin` | `'top-center'` | Where the light comes from: `top-center`, `top-left`, `top-right`, `left`, `right`, `bottom-center`, `bottom-left`, `bottom-right`. |
| `rays-color`             | `string`     | `'#ffffff'`    | Color of the light (hex or `rgb()`).                                                                                                |
| `rays-speed`             | `number`     | `1`            | Animation speed. 0 freezes the rays.                                                                                                |
| `light-spread`           | `number`     | `0.5`          | How wide the beam opens. Lower values give a tight spotlight.                                                                       |
| `ray-length`             | `number`     | `3`            | How far the rays reach, in container widths.                                                                                        |
| `ray-density`            | `number`     | `1`            | How many separate shafts the beam splits into.                                                                                      |
| `tilt`                   | `number`     | `0`            | Turns the beam by this many degrees.                                                                                                |
| `ray-sharpness`          | `number`     | `0.35`         | How crisp the edges of the shafts are, from 0 to 1.                                                                                 |
| `glow`                   | `number`     | `0.6`          | Brightness of the glow around the light source.                                                                                     |
| `haze`                   | `number`     | `0.25`         | Drifting haze that breaks the shafts up, like dust in the air, from 0 to 1.                                                         |
| `atmosphere`             | `number`     | `1`            | How much the light cools toward blue as it travels away from the source, from 0 to 1.                                               |
| `intensity`              | `number`     | `1`            | Overall brightness of the light.                                                                                                    |
| `pulsating`              | `boolean`    | `false`        | The rays slowly breathe brighter and dimmer.                                                                                        |
| `fade-distance`          | `number`     | `1`            | How far the rays travel before they dim, in container widths.                                                                       |
| `saturation`             | `number`     | `1`            | Color saturation of the light.                                                                                                      |
| `follow-mouse`           | `boolean`    | `true`         | The beam turns toward the cursor.                                                                                                   |
| `mouse-influence`        | `number`     | `0.1`          | How far the beam turns toward the cursor, from 0 to 1.                                                                              |
| `cursor-shadow`          | `boolean`    | `true`         | The cursor blocks the light and casts a soft shadow down the rays.                                                                  |
| `click-pulse`            | `boolean`    | `true`         | Clicking sends a wave of light down the rays.                                                                                       |
| `noise-amount`           | `number`     | `0`            | Film grain over the rays, from 0 to 1.                                                                                              |
| `distortion`             | `number`     | `0`            | Makes the rays waver as if seen through heat.                                                                                       |
| `intro`                  | `boolean`    | `true`         | The rays grow out from the source on mount.                                                                                         |
| `light-mode`             | `boolean`    | `false`        | Prints the light as soft colored ink so it sits on light pages.                                                                     |
| `opacity`                | `number`     | `1`            | Overall opacity, from 0 to 1.                                                                                                       |
| `max-device-pixel-ratio` | `number`     | `2`            | Highest pixel ratio the canvas renders at.                                                                                          |
| `class`                  | `string`     | `''`           | Extra classes for the container.                                                                                                    |

## Accessibility

- The canvas is decorative (`aria-hidden="true"`) and the container has `pointer-events: none`, so it never blocks content placed above it. Pointer tracking listens on the window.
- With `prefers-reduced-motion: reduce`, the intro, cursor shadow and click waves are skipped and the rays drift at 35% speed.
- Rendering pauses when the component is offscreen, the tab is hidden, or nothing is moving (`rays-speed` 0 and the pointer at rest).
- A lost WebGL context is restored automatically.

- Ported from [React Bits](https://reactbits.dev/backgrounds/light-rays) by David Haz.
