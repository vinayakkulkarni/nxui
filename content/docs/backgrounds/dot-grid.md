---
title: Dot Grid
description: A springy dot grid that the cursor flicks and drags through like jelly, with click shockwaves.
---

A grid of springy dots drawn with instanced WebGL2. The dots pop in from the center when the grid appears. Move the cursor through it to flick and drag the dots; they streak as they move, light up, wobble back into place and pass the ripple to their neighbours. Click to send a shockwave out across the grid.

::demo-dot-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dot-grid.json"
```

## Usage

```vue
<script setup lang="ts">
  import DotGrid from '~/components/ui/dot-grid/DotGrid.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <DotGrid
      base-color="#3a3446"
      active-color="#ffffff"
      :dot-size="5"
      :gap="18"
      :proximity="140"
    />
  </div>
</template>
```

Each dot is a damped spring tied to its rest position. With `tension` above
0 every dot also pulls on its four neighbours, so a push travels through the
grid like jelly. The simulation sub-steps as needed to stay stable, and the
loop stops as soon as every dot has settled.

## Props

| Prop                | Type                   | Default     | Description                                                              |
| ------------------- | ---------------------- | ----------- | ------------------------------------------------------------------------ |
| `base-color`        | `string`               | `'#3a3446'` | Color of the dots at rest. Hex only.                                     |
| `active-color`      | `string`               | `'#ffffff'` | Color the dots light up to while they move or sit near the cursor.       |
| `shape`             | `'circle' \| 'square'` | `'circle'`  | Shape of each dot.                                                       |
| `dot-size`          | `number`               | `5`         | Size of each dot, in px.                                                 |
| `gap`               | `number`               | `18`        | Space between dots, in px.                                               |
| `proximity`         | `number`               | `140`       | Radius around the cursor that pushes the dots and lights them up, in px. |
| `strength`          | `number`               | `1`         | How hard a moving cursor pushes the dots.                                |
| `bounce`            | `number`               | `0.6`       | How much the dots overshoot and wobble as they settle, 0 to 1.           |
| `tension`           | `number`               | `0.4`       | How strongly each dot pulls on its neighbours. 0 keeps them independent. |
| `return-duration`   | `number`               | `0.8`       | Roughly how long the dots take to settle back into place, in seconds.    |
| `shock-radius`      | `number`               | `320`       | How far a click shockwave travels, in px.                                |
| `shock-strength`    | `number`               | `5`         | How hard a click shockwave pushes the dots.                              |
| `swell`             | `number`               | `0.8`       | How much the dots grow while they are lit.                               |
| `stretch`           | `number`               | `0.5`       | How much moving dots stretch into short streaks along their motion.      |
| `glow`              | `number`               | `0.5`       | Soft halo around lit dots.                                               |
| `fade`              | `number`               | `0`         | Fades the grid out toward the edges, 0 to 1.                             |
| `opacity`           | `number`               | `1`         | Overall opacity of the grid.                                             |
| `intro`             | `boolean`              | `true`      | Pops the dots in from the center when the grid first appears.            |
| `mouse-interaction` | `boolean`              | `true`      | Lets the cursor push the dots and light them up.                         |
| `click-shock`       | `boolean`              | `true`      | Sends a shockwave out from each click.                                   |
| `paused`            | `boolean`              | `false`     | Freezes the animation.                                                   |
| `dpr`               | `number`               | auto        | Maximum device pixel ratio, capped at 2.                                 |
| `class`             | `string`               | `''`        | Extra classes for the container.                                         |

## Accessibility

- The canvas is decorative, marked `aria-hidden="true"` and ignores pointer events, so content on top stays clickable.
- With `prefers-reduced-motion: reduce` the dots stay still: no intro, no cursor push, no streaks and no shockwaves.
- Pointer tracking is passive and never blocks scrolling.

- Ported from [React Bits](https://reactbits.dev/backgrounds/dot-grid) by David Haz.
