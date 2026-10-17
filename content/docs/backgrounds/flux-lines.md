---
title: Flux Lines
description: Glowing flux lines trace a churning magnetic fluid. The cursor acts as a magnet that reveals and curls the lines.
---

A WebGL2 background of glowing contour lines that drift through a two-layer fluid. Move the cursor over it to reveal and curl the lines around a magnet, and click to stir the fluid into a swirl.

::demo-flux-lines
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flux-lines.json"
```

## Usage

```vue
<script setup lang="ts">
  import FluxLines from '~/components/ui/flux-lines/FluxLines.vue';
</script>

<template>
  <div class="relative h-125 w-full">
    <FluxLines
      :colors="['#ffd29a', '#ff8a4c', '#ffb36b']"
      :speed="0.5"
      :glow="2"
      flow-direction="down"
    />
  </div>
</template>
```

## Props

| Prop                | Type                                  | Default                             | Description                                                                               |
| ------------------- | ------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `colors`            | `string[]`                            | `['#ffffff', '#ffffff', '#ffffff']` | Up to 8 colors blended along the lines. A single color makes every line the same.         |
| `speed`             | `number`                              | `0.5`                               | How fast the fluid churns and flows.                                                      |
| `scale`             | `number`                              | `1.6`                               | Zoom of the pattern. Higher values show bigger, fewer shapes.                             |
| `turbulence`        | `number`                              | `1`                                 | How much the flow swirls and distorts.                                                    |
| `fluidity`          | `number`                              | `0.1`                               | How smoothly the two layers of the fluid merge. Higher values give softer, rounder lines. |
| `rim-width`         | `number`                              | `0.2`                               | Thickness of the glow around each line.                                                   |
| `sharpness`         | `number`                              | `2.5`                               | Falloff of the glow. Higher values are tighter.                                           |
| `shimmer`           | `number`                              | `1.5`                               | How much the lines break up into separate strokes. 0 shows every line.                    |
| `glow`              | `number`                              | `2`                                 | Brightness of the lines.                                                                  |
| `line-width`        | `number`                              | `1`                                 | Width of the crisp core inside each line, in pixels. 0 keeps only the glow.               |
| `flow-direction`    | `'up' \| 'down' \| 'left' \| 'right'` | `'down'`                            | Main direction the fluid drifts.                                                          |
| `mouse-interaction` | `boolean`                             | `true`                              | Turns the cursor into a magnet that reveals and curls the lines around it.                |
| `mouse-strength`    | `number`                              | `1`                                 | Strength of the cursor magnet.                                                            |
| `mouse-radius`      | `number`                              | `0.35`                              | Reach of the cursor magnet, as a fraction of the height.                                  |
| `mouse-dampening`   | `number`                              | `0.15`                              | Time in seconds the magnet takes to catch up with the cursor. 0 follows instantly.        |
| `click-swirl`       | `boolean`                             | `true`                              | Clicking stirs the fluid into a swirl.                                                    |
| `intro`             | `boolean`                             | `true`                              | Fades the lines in on mount.                                                              |
| `light-mode`        | `boolean`                             | `false`                             | Draws the lines as ink for light backgrounds.                                             |
| `transparent`       | `boolean`                             | `true`                              | Lets the page show through. When off, the lines sit on the background color.              |
| `background-color`  | `string`                              | `'#120f17'`                         | Background color when `transparent` is off. Defaults to white in light mode.              |
| `opacity`           | `number`                              | `1`                                 | Opacity of the whole effect.                                                              |
| `paused`            | `boolean`                             | `false`                             | Freezes the flow.                                                                         |
| `mix-blend-mode`    | `string`                              | —                                   | CSS `mix-blend-mode` applied to the container.                                            |
| `dpr`               | `number`                              | `devicePixelRatio`                  | Maximum device pixel ratio, capped at 2.                                                  |
| `class`             | `string`                              | `''`                                | Additional CSS classes for the container.                                                 |

## Accessibility

- The canvas is hidden from assistive technology (`aria-hidden`). Put real content on top of it.
- With `prefers-reduced-motion: reduce` the flow stops, the intro is skipped and click swirls are off. The cursor magnet still works.
- The render loop stops when the effect is offscreen, the tab is hidden, or nothing is moving.

- Ported from [React Bits](https://reactbits.dev/backgrounds/flux-lines) by David Haz.
