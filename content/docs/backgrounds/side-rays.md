---
title: Side Rays
description: Shafts of light that fan in from a corner or side, shimmer slowly and lean toward the cursor.
---

Soft shafts of light fan in from a corner or a side of the container and shimmer slowly. They grow out from their source on load, lean toward the cursor and brighten the ray under it. Add drifting dust for a cathedral look, or switch to light mode for white pages.

::demo-side-rays
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/side-rays.json"
```

## Usage

```vue
<script setup lang="ts">
  import SideRays from '~/components/ui/side-rays/SideRays.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-zinc-950">
    <SideRays
      ray-color1="#ffe2b0"
      ray-color2="#ffd28a"
      :spread="2.6"
      :density="12"
      :sharpness="0.8"
      :dust="0.5"
    />
  </div>
</template>
```

The rays render into a transparent WebGL2 canvas with `pointer-events: none`,
so the container's background shows through and content above stays clickable.

## Props

| Prop                     | Type                                                                                | Default       | Description                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| `ray-color1`             | `string`                                                                            | `'#FFC46B'`   | Color of the first layer of rays, on the upper side of the fan.                       |
| `ray-color2`             | `string`                                                                            | `'#96c8ff'`   | Color of the second layer of rays, on the lower side of the fan.                      |
| `blend`                  | `number`                                                                            | `0.6`         | Balance between the two layers, from 0 (only the first color) to 1 (only the second). |
| `origin`                 | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' \| 'right' \| 'left'` | `'top-right'` | Corner or side the light shines in from.                                              |
| `speed`                  | `number`                                                                            | `2.5`         | How fast the rays shimmer and sway. 0 freezes them.                                   |
| `intensity`              | `number`                                                                            | `2`           | Brightness of the light.                                                              |
| `spread`                 | `number`                                                                            | `2`           | How wide the rays fan out.                                                            |
| `density`                | `number`                                                                            | `5`           | How many separate rays the light breaks into. Higher values give finer rays.          |
| `sharpness`              | `number`                                                                            | `0.5`         | How crisp the edges of the rays are, from soft haze at 0 to defined beams at 1.       |
| `tilt`                   | `number`                                                                            | `0`           | Rotates the rays, in degrees.                                                         |
| `falloff`                | `number`                                                                            | `1.6`         | How quickly the light fades with distance. Lower values let the rays reach further.   |
| `glow`                   | `number`                                                                            | `1`           | Brightness of the glow where the light enters.                                        |
| `saturation`             | `number`                                                                            | `1`           | Color saturation of the light. 0 is grayscale.                                        |
| `dust`                   | `number`                                                                            | `0`           | Amount of dust drifting in the light, from 0 to 1. Specks only show inside the rays.  |
| `follow-mouse`           | `boolean`                                                                           | `true`        | The rays lean toward the cursor and the ray under it brightens.                       |
| `mouse-influence`        | `number`                                                                            | `0.5`         | How strongly the rays follow the cursor, from 0 to 1.                                 |
| `intro`                  | `boolean`                                                                           | `true`        | The rays grow out from their source on mount.                                         |
| `light-mode`             | `boolean`                                                                           | `false`       | Renders the rays as soft tinted light for light backgrounds.                          |
| `opacity`                | `number`                                                                            | `1`           | Overall opacity, from 0 to 1.                                                         |
| `max-device-pixel-ratio` | `number`                                                                            | `2`           | Highest pixel ratio the canvas renders at.                                            |
| `class`                  | `string`                                                                            | `''`          | Extra classes for the container.                                                      |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. The container ignores pointer events, so it never blocks content.
- With `prefers-reduced-motion: reduce`, the rays stop swaying, shimmer at a much slower pace and ignore the cursor.
- The animation pauses while the container is offscreen or the tab is hidden, and recovers if the WebGL context is lost.

- Ported from [React Bits](https://reactbits.dev/backgrounds/side-rays) by David Haz.
