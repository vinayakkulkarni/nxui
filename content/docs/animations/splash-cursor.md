---
title: Splash Cursor
description: A WebGL fluid simulation that trails the cursor in swirling ink and bursts into a splash on click.
---

A real-time fluid simulation follows your pointer as one unbroken stroke of ink whose color shifts as you move. Click or tap to burst a petal-shaped splash, and the effect rests when nothing moves. Use it full-screen over a page or `contained` inside one section, with a light theme where the ink absorbs instead of glowing.

::demo-splash-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/splash-cursor.json"
```

## Usage

```vue
<script setup lang="ts">
  import { SplashCursor } from '~/components/ui/splash-cursor';
</script>

<template>
  <!-- Covers the whole viewport and ignores pointer events -->
  <SplashCursor :colors="['#a855f7']" :rainbow="false" />

  <!-- Or only inside one section -->
  <section class="relative h-125">
    <SplashCursor contained :swirl="8" :trail="2.2" />
  </section>
</template>
```

## Props

| Prop           | Type                          | Default                             | Description                                                                 |
| -------------- | ----------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `colors`       | `string[]`                    | `['#4f8cff', '#2dd4bf', '#ffd166']` | Palette the ink cycles through when `rainbow` is off.                       |
| `rainbow`      | `boolean`                     | `true`                              | Cycles through the full spectrum instead of the palette.                    |
| `color-speed`  | `number`                      | `1`                                 | How fast the colors shift while you move. `0` keeps one color per stroke.   |
| `intensity`    | `number`                      | `1`                                 | How much ink each movement leaves behind.                                   |
| `size`         | `number`                      | `1`                                 | Width of the stroke and the splash.                                         |
| `force`        | `number`                      | `1`                                 | How hard the cursor pushes the fluid.                                       |
| `swirl`        | `number`                      | `3`                                 | Amount of curling eddies in the flow.                                       |
| `trail`        | `number`                      | `1`                                 | How long the ink lingers before it fades. `2` lasts twice as long.          |
| `momentum`     | `number`                      | `1`                                 | How long the fluid keeps moving after the cursor stops.                     |
| `shading`      | `number`                      | `1`                                 | Depth shading on the ripples, from 0 to 1.                                  |
| `glow`         | `number`                      | `0`                                 | Soft bloom around the brightest ink, from 0 to 1.                           |
| `quality`      | `'low' \| 'medium' \| 'high'` | `'high'`                            | Simulation detail. Lower settings are lighter on older devices.             |
| `click-splash` | `boolean`                     | `true`                              | Bursts a splash where you click or tap.                                     |
| `intro`        | `boolean`                     | `true`                              | Plays a short stroke across the screen on mount.                            |
| `contained`    | `boolean`                     | `false`                             | Fills the parent element instead of the viewport and only reacts inside it. |
| `theme`        | `'dark' \| 'light'`           | `'dark'`                            | Glowing ink for dark backgrounds or absorbing ink for light ones.           |
| `z-index`      | `number`                      | `50`                                | Stacking order of the effect over your content.                             |
| `class`        | `string`                      | `''`                                | Extra classes merged on the container.                                      |

## Accessibility

- The overlay is `aria-hidden` and `pointer-events: none`, so it never blocks clicks, focus or screen readers.
- The intro stroke is skipped when `prefers-reduced-motion: reduce` is set; ink only appears in response to the user's own pointer.
- The render loop stops and the canvas clears once the ink has faded, so an idle page costs nothing.
- Needs WebGL2 with half-float render targets; without them the component renders nothing.

- Ported from [React Bits](https://reactbits.dev/animations/splash-cursor) by David Haz.
