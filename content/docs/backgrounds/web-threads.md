---
title: Web Threads
description: Glowing threads woven through luminous pinch points that light up under the cursor and carry light on click.
---

A WebGL2 background of glowing threads that weave through one or more pinch points. The threads draw in one after another when they first come into view. Hover a strand to light it up while the others recede, and click to send light along every thread into the pinch.

::demo-web-threads
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/web-threads.json"
```

## Usage

```vue
<script setup lang="ts">
  import WebThreads from '~/components/ui/web-threads/WebThreads.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <WebThreads :colors="['#5227FF', '#FF9FFC']" :thread-count="6" />
  </div>
</template>
```

## Props

| Prop                | Type       | Default                  | Description                                                                                          |
| ------------------- | ---------- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `colors`            | `string[]` | `['#5227FF', '#FF9FFC']` | Gradient across the threads, from the first thread to the last. Up to six colors.                    |
| `core-color`        | `string`   | `'#FFFFFF'`              | Hot color where threads overlap and converge.                                                        |
| `background-color`  | `string`   | `'transparent'`          | Fills the canvas behind the threads. Transparent lets the page show through.                         |
| `light-mode`        | `boolean`  | `false`                  | Draws crisp ink strokes for light backgrounds instead of glowing light.                              |
| `thread-count`      | `number`   | `6`                      | Number of threads, up to 24.                                                                         |
| `speed`             | `number`   | `0.2`                    | How fast the threads weave.                                                                          |
| `frequency`         | `number`   | `5`                      | How many waves fit across the width.                                                                 |
| `spread`            | `number`   | `0.18`                   | How far the threads fan away from the pinch.                                                         |
| `taper`             | `number`   | `1`                      | How much wider each next thread swings, nesting them inside each other.                              |
| `position`          | `number`   | `0.5`                    | Height of the weave, from bottom 0 to top 1.                                                         |
| `pinch`             | `number`   | `0.5`                    | Where the threads converge across the width, from 0 to 1.                                            |
| `nodes`             | `number`   | `1`                      | Number of pinch points. More than one braids the threads through each of them.                       |
| `angle`             | `number`   | `0`                      | Rotation of the whole weave in degrees.                                                              |
| `glow`              | `number`   | `0.02`                   | Strength of the light around each thread.                                                            |
| `falloff`           | `number`   | `0.6`                    | How quickly the glow fades. Higher is tighter.                                                       |
| `thickness`         | `number`   | `1.1`                    | Width of the threads.                                                                                |
| `brightness`        | `number`   | `0.6`                    | Overall brightness.                                                                                  |
| `opacity`           | `number`   | `1`                      | Opacity of the whole effect.                                                                         |
| `depth`             | `number`   | `0`                      | Twists the threads in 3D, so strands behind the bundle turn thinner and dimmer.                      |
| `pulses`            | `number`   | `0`                      | Strength of light pulses that travel along the threads toward the pinch.                             |
| `mirror`            | `boolean`  | `true`                   | Weaves each side of the pinch as a mirror.                                                           |
| `shimmer`           | `boolean`  | `false`                  | Adds a gentle, uneven sway to each thread.                                                           |
| `fade`              | `number`   | `0`                      | Fades the threads out toward both ends so they melt into the page.                                   |
| `grain`             | `number`   | `0.05`                   | Film grain in the light. 0 turns it off.                                                             |
| `intro`             | `boolean`  | `true`                   | Draws the threads in one after another the first time they come into view, each led by a soft light. |
| `mouse-interaction` | `boolean`  | `true`                   | The strand nearest the cursor lights up while the others recede.                                     |
| `mouse-strength`    | `number`   | `0.5`                    | How strongly the focused strand stands out from the rest.                                            |
| `pulse-on-click`    | `boolean`  | `true`                   | Clicking sends light along every thread, gathering in the pinch and fading out the far side.         |
| `paused`            | `boolean`  | `false`                  | Freezes the weaving.                                                                                 |
| `dpr`               | `number`   | `2`                      | Maximum device pixel ratio of the canvas.                                                            |
| `class`             | `string`   | `''`                     | Extra classes for the container.                                                                     |

## Accessibility

The canvas is decorative and hidden from assistive technology (`aria-hidden`). With `prefers-reduced-motion: reduce` the weave holds still, the intro and shimmer are skipped and clicks do not send light. Clicks on links, buttons and form controls placed over the background never trigger a pulse. Rendering pauses while the effect is off screen.

- Ported from [React Bits](https://reactbits.dev/backgrounds/web-threads) by David Haz.
