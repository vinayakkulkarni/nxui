---
title: Balatro
description: The swirling Balatro paint shader, with crisp pixels, a cursor that stirs the paint and click whirlpools.
---

Two paints swirl around a center like the background of the card game Balatro, drawn with raw WebGL2 at a crisp pixel size. Move the cursor to stir the paint and steer the swirl, click to spin up a whirlpool that slowly unwinds, and turn up `crt` for scanlines. The swirl spins into place when it mounts. No extra dependencies.

::demo-balatro
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/balatro.json"
```

## Usage

```vue
<script setup lang="ts">
  import Balatro from '~/components/ui/balatro/Balatro.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Balatro
      color1="#DE443B"
      color2="#006BB4"
      color3="#162325"
      :contrast="3.5"
      :swirl="0.25"
      :pixel-size="1.5"
      mouse-interaction
      click-swirl
    />
  </div>
</template>
```

Set `:pixel-size="0"` for a smooth render, or `:pixel-size="4"` with `:crt="1"` for an arcade screen. On light pages pass `light-mode`: the gaps between the paints turn pale.

## Props

| Prop                     | Type               | Default     | Description                                                                 |
| ------------------------ | ------------------ | ----------- | --------------------------------------------------------------------------- |
| `color1`                 | `string`           | `'#DE443B'` | Main paint color.                                                           |
| `color2`                 | `string`           | `'#006BB4'` | Second paint color, swirled into the first.                                 |
| `color3`                 | `string`           | `'#162325'` | Color of the gaps between the two paints.                                   |
| `contrast`               | `number`           | `3.5`       | How sharply the paints separate. Lower values blend them into soft washes.  |
| `lighting`               | `number`           | `0.4`       | Strength of the glossy highlights on the paint.                             |
| `swirl`                  | `number`           | `0.25`      | How tightly the paint spirals around the center, from 0 to 1.               |
| `speed`                  | `number`           | `1`         | How fast the paint flows. `0` freezes it.                                   |
| `rotation-speed`         | `number`           | `0`         | Turns the whole swirl continuously. Negative values turn it the other way.  |
| `scale`                  | `number`           | `1`         | Size of the paint shapes. Higher values zoom in.                            |
| `detail`                 | `number`           | `5`         | How many times the paint folds over itself, from 1 to 8.                    |
| `offset`                 | `[number, number]` | `[0, 0]`    | Moves the center of the swirl, as a fraction of the container diagonal.     |
| `pixel-size`             | `number`           | `1.5`       | Size of the pixels in CSS pixels. `0` renders it smooth.                    |
| `crt`                    | `number`           | `0`         | Adds the scanlines and soft edge falloff of an old CRT screen, from 0 to 1. |
| `mouse-interaction`      | `boolean`          | `true`      | The cursor stirs the paint and steers the swirl.                            |
| `mouse-strength`         | `number`           | `1`         | How strongly the cursor drags the paint along.                              |
| `click-swirl`            | `boolean`          | `true`      | Clicking spins the paint into a whirlpool that slowly unwinds.              |
| `intro`                  | `boolean`          | `true`      | The swirl spins into place on mount.                                        |
| `light-mode`             | `boolean`          | `false`     | Lightens the gaps between the paints so it sits on light pages.             |
| `opacity`                | `number`           | `1`         | Overall opacity, from 0 to 1.                                               |
| `max-device-pixel-ratio` | `number`           | `2`         | Highest pixel ratio the canvas renders at.                                  |
| `class`                  | `string`           | `''`        | Extra classes for the container.                                            |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the paint flows at a fifth of the speed, cursor stirring is softened, and the intro and click whirlpools are skipped.
- Rendering stops while the component is off screen, the tab is hidden, or nothing is moving.

- Ported from [React Bits](https://reactbits.dev/backgrounds/balatro) by David Haz.
