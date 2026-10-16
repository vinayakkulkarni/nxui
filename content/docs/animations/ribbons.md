---
title: Ribbons
description: Springy WebGL2 ribbons that trail the cursor, in lens, comet or even shapes, with an optional rolling wave, soft edges and tail fade.
---

Ribbons of color that chase the cursor on springs and trail behind it. Move the pointer (or tap on touch screens) anywhere over the area and the ribbons follow, overshoot and settle. The motion runs on a fixed time step, so it looks the same at any frame rate.

::demo-ribbons
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ribbons.json"
```

## Usage

```vue
<script setup lang="ts">
  import { Ribbons } from '~/components/ui/ribbons';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Ribbons
      class="absolute inset-0"
      :colors="['#3847ff', '#7c84ff', '#c7cbff']"
      shape="comet"
      :thickness="26"
      :length="2.2"
      :wave="0.3"
      fade
    />
  </div>
</template>
```

The canvas ignores pointer events, so content underneath stays clickable. It listens to pointer movement on the window and only reacts while the pointer is inside its own box.

## Props

| Prop               | Type                          | Default                             | Description                                                                                          |
| ------------------ | ----------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `colors`           | `string[]`                    | `['#3847ff', '#7c84ff', '#c7cbff']` | One ribbon per color, drawn back to front (up to 12). Any CSS color works.                           |
| `shape`            | `'lens' \| 'comet' \| 'even'` | `'lens'`                            | Width along each ribbon. Lens swells in the middle, comet is widest at the cursor, even stays level. |
| `thickness`        | `number`                      | `30`                                | Width of each ribbon at its widest, in pixels.                                                       |
| `length`           | `number`                      | `1.4`                               | How far the ribbons trail behind the cursor. Higher values leave longer, lazier trails.              |
| `spread`           | `number`                      | `18`                                | Space between the ribbons, in pixels.                                                                |
| `stiffness`        | `number`                      | `0.5`                               | How tightly the ribbons chase the cursor, from 0 to 1.                                               |
| `bounce`           | `number`                      | `0.5`                               | How far the ribbons overshoot and swing back when the cursor stops or turns, from 0 to 1.            |
| `wave`             | `number`                      | `0`                                 | A wave that rolls along each ribbon, from 0 to 1.                                                    |
| `softness`         | `number`                      | `0`                                 | Blurs the ribbon edges into soft light trails, from 0 to 1.                                          |
| `fade`             | `boolean`                     | `false`                             | Fades each ribbon out toward its tail.                                                               |
| `opacity`          | `number`                      | `1`                                 | Opacity of the ribbons.                                                                              |
| `background-color` | `string`                      | `'transparent'`                     | Color behind the ribbons. The canvas is transparent by default.                                      |
| `dpr`              | `number`                      | auto                                | Device pixel ratio override. Defaults to the screen ratio capped at 2.                               |
| `class`            | `string`                      | `''`                                | Extra classes for the container.                                                                     |

## Accessibility

- The effect is decorative: the canvas has no role and ignores pointer events.
- With `prefers-reduced-motion: reduce` the rolling wave is turned off; the ribbons still follow the pointer, since that motion is user-driven.
- Rendering pauses while the component is off screen, and the WebGL program and buffers are released on unmount.

- Ported from [React Bits](https://reactbits.dev/animations/ribbons) by David Haz.
