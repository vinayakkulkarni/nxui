---
title: Glare Hover
description: A glossy light streak that sweeps across any element in the direction the cursor moves.
---

Wrap any element to give it a glossy glare. On hover the light enters from the side the pointer came in and sweeps out the other way when it leaves, while a thin rim glint catches the edge. Switch the mode to make the glare follow the cursor, shine on a timer, or sweep on click.

::demo-glare-hover
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glare-hover.json"
```

## Usage

```vue
<script setup lang="ts">
  import GlareHover from '~/components/ui/glare-hover/GlareHover.vue';
</script>

<template>
  <GlareHover
    width="min(360px, 82vw)"
    border-radius="20px"
    variant="twin"
    :glare-angle="-60"
  >
    <img src="/sky.webp" alt="" class="block aspect-3/2 w-full object-cover" />
  </GlareHover>

  <GlareHover mode="loop" :interval="2.5" :glare-size="16" border-radius="12px">
    <button class="px-6 py-3">Get started</button>
  </GlareHover>
</template>
```

The glare is a rotated band painted with a 33-stop gradient, moved with transforms in one `requestAnimationFrame` loop that only runs while the light is moving.

## Props

| Prop                  | Type                                                | Default         | Description                                                               |
| --------------------- | --------------------------------------------------- | --------------- | ------------------------------------------------------------------------- |
| `mode`                | `'hover' \| 'follow' \| 'loop' \| 'click'`          | `'hover'`       | Sweep on hover, follow the cursor, shine on a timer, or sweep on click.   |
| `variant`             | `'streak' \| 'twin' \| 'sheen'`                     | `'streak'`      | One bright streak, a double streak like glass, or a soft wide sheen.      |
| `glare-color`         | `string`                                            | `'#ffffff'`     | Color of the glare.                                                       |
| `glare-opacity`       | `number`                                            | `0.5`           | Peak opacity of the glare, 0–1.                                           |
| `glare-angle`         | `number`                                            | `-45`           | Direction the glare travels, in degrees.                                  |
| `glare-size`          | `number`                                            | `30`            | Width of the glare as a percentage of the element's diagonal.             |
| `softness`            | `number`                                            | `0.6`           | How soft the edges of the glare are, 0–1.                                 |
| `blend-mode`          | `'screen' \| 'normal' \| 'overlay' \| 'soft-light'` | `'screen'`      | How the glare mixes with the content.                                     |
| `rim-glint`           | `boolean`                                           | `true`          | Lets the edge catch the light where the glare crosses it.                 |
| `transition-duration` | `number`                                            | `650`           | How long one sweep takes, in milliseconds.                                |
| `interval`            | `number`                                            | `3`             | Seconds between sweeps in loop mode.                                      |
| `play-once`           | `boolean`                                           | `false`         | In hover mode, sweeps only on the way in instead of again on the way out. |
| `intro`               | `boolean`                                           | `false`         | Sweeps once when the element first scrolls into view.                     |
| `width`               | `string`                                            | `'auto'`        | CSS width of the wrapper.                                                 |
| `height`              | `string`                                            | `'auto'`        | CSS height of the wrapper.                                                |
| `background`          | `string`                                            | `'transparent'` | CSS background of the wrapper.                                            |
| `border-radius`       | `string`                                            | `'10px'`        | CSS border radius of the wrapper.                                         |
| `border-color`        | `string`                                            | `'transparent'` | Color of the 1px border.                                                  |
| `class`               | `string`                                            | `''`            | Extra classes for the wrapper.                                            |

## Slots

| Slot      | Description                      |
| --------- | -------------------------------- |
| `default` | Content the glare sweeps across. |

## Accessibility

- The glare layer is `aria-hidden` and `pointer-events: none`, so it never blocks clicks or focus.
- Keyboard focus (`:focus-visible`) inside the wrapper also triggers a sweep.
- With `prefers-reduced-motion: reduce` no sweeps run and loop mode stops.

- Ported from [React Bits](https://reactbits.dev/animations/glare-hover) by David Haz.
