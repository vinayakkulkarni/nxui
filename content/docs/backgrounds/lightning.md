---
title: Lightning
description: Crackling, branching lightning that bends toward the cursor and strikes wherever you click.
---

Jagged, branching bolts that crawl and flicker in a seamless loop. Move the cursor near a bolt and it bends toward you, crackles and grows extra branches. Click anywhere to call down a strike that lands on that spot and briefly flashes the other bolts. Raw WebGL2, no extra dependencies.

::demo-lightning
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/lightning.json"
```

## Usage

```vue
<script setup lang="ts">
  import Lightning from '~/components/ui/lightning/Lightning.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Lightning
      color="#4d6bff"
      :bolts="3"
      :spread="0.8"
      :branches="0.8"
      :flicker="0.85"
    />
  </div>
</template>
```

The canvas is transparent, so it sits on top of any page background. Use `light-mode` on light pages: the bolts become crisp ink strokes instead of a glow.

## Props

| Prop                | Type      | Default     | Description                                                                      |
| ------------------- | --------- | ----------- | -------------------------------------------------------------------------------- |
| `color`             | `string`  | `'#4d6bff'` | Color of the lightning (hex). The hottest parts glow white.                      |
| `bolts`             | `number`  | `1`         | How many bolts to draw, from 1 to 4.                                             |
| `spread`            | `number`  | `0.6`       | Space between bolts when there is more than one.                                 |
| `branches`          | `number`  | `0.5`       | How many side branches split off and flash along the bolts, from 0 to 1.         |
| `x-offset`          | `number`  | `0`         | Moves the bolts sideways.                                                        |
| `angle`             | `number`  | `0`         | Tilts the bolts, in degrees. 90 runs them across.                                |
| `size`              | `number`  | `1`         | Scale of the jagged path. Higher is more crooked.                                |
| `thickness`         | `number`  | `1`         | Thickness of the bright core.                                                    |
| `glow`              | `number`  | `1`         | How far the glow spreads around the bolts.                                       |
| `intensity`         | `number`  | `1`         | Overall brightness.                                                              |
| `speed`             | `number`  | `1`         | How fast the bolts crawl. The motion loops seamlessly every 10 seconds at 1.     |
| `flicker`           | `number`  | `0.6`       | Strength of the flicker and sudden flashes, from 0 to 1.                         |
| `mouse-interaction` | `boolean` | `true`      | Bolts bend toward the cursor, crackle and grow extra branches near it.           |
| `mouse-strength`    | `number`  | `1`         | How strongly the bolts bend toward the cursor.                                   |
| `click-strike`      | `boolean` | `true`      | Clicking calls down a bolt that strikes the spot and briefly flashes the others. |
| `intro`             | `boolean` | `true`      | Lets the bolts descend from the top on first load.                               |
| `fade`              | `number`  | `0`         | Fades the edges into the page, from 0 to 1.                                      |
| `opacity`           | `number`  | `1`         | Opacity of the whole effect.                                                     |
| `light-mode`        | `boolean` | `false`     | Draws the lightning as crisp ink strokes for light backgrounds.                  |
| `paused`            | `boolean` | `false`     | Freezes the animation.                                                           |
| `dpr`               | `number`  | auto        | Maximum device pixel ratio, capped at 2.                                         |
| `class`             | `string`  | `''`        | Extra classes for the canvas.                                                    |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the bolts hold still, flicker is off, the intro and click strikes are skipped and the cursor no longer bends them.
- Rendering stops while the canvas is off screen or the tab is hidden, and the loop sleeps when nothing moves (`speed` 0 or `paused`).

- Ported from [React Bits](https://reactbits.dev/backgrounds/lightning) by David Haz.
