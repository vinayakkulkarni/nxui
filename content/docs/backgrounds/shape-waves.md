---
title: Shape Waves
description: A field of triangles, circles and squares that brighten and grow along rolling waves, with optional text carved out of the grid.
---

A WebGL2 grid of small shapes that morph between triangles, circles and squares as noise waves roll through it. The shapes pop in from the centre on mount, text can be cut out of the field, and moving the cursor drops splashes that ripple outward, cycle the shapes and light them up with a soft glow.

::demo-shape-waves
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shape-waves.json"
```

## Usage

```vue
<script setup lang="ts">
  import ShapeWaves from '~/components/ui/shape-waves/ShapeWaves.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <ShapeWaves
      text="</>"
      shapes="mixed"
      color="#929292"
      hover-color="#ffffff"
      background-color="#120f17"
      :cell-size="10"
      :glow="0.35"
      class="absolute inset-0"
    />
  </div>
</template>
```

## Props

| Prop               | Type                                               | Default                                        | Description                                                                                                                                 |
| ------------------ | -------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`             | `string`                                           | `''`                                           | Optional text carved out of the field. Cells under the glyphs stay empty and the waves flow around them.                                    |
| `font-family`      | `string`                                           | `'Geist, "Geist Sans", system-ui, sans-serif'` | CSS font family used to draw the text cutout.                                                                                               |
| `font-weight`      | `string \| number`                                 | `500`                                          | Font weight of the text cutout.                                                                                                             |
| `text-size`        | `number`                                           | `0.6`                                          | Text height as a fraction of the container height. Long text shrinks to fit the width.                                                      |
| `shapes`           | `'mixed' \| 'squares' \| 'circles' \| 'triangles'` | `'mixed'`                                      | `'mixed'` draws dark bands as triangles, mid bands as circles and bright bands as squares. A single shape varies its size per band instead. |
| `cell-size`        | `number`                                           | `10`                                           | Size of one grid cell in CSS pixels.                                                                                                        |
| `dot-size`         | `number`                                           | `0.75`                                         | Glyph size as a fraction of the cell.                                                                                                       |
| `color`            | `string`                                           | `'#929292'`                                    | Glyph color. One flat color for the whole field.                                                                                            |
| `hover-color`      | `string`                                           | `'#ffffff'`                                    | Color the glyphs step towards inside a splash.                                                                                              |
| `background-color` | `string`                                           | `'#000000'`                                    | Background color behind the glyphs.                                                                                                         |
| `speed`            | `number`                                           | `1`                                            | How fast the wave bands morph over time. 0 freezes them.                                                                                    |
| `scale`            | `number`                                           | `1`                                            | Size of the wave bands. Larger values give broader, calmer swells.                                                                          |
| `contrast`         | `number`                                           | `1`                                            | How sharply the field is cut into its three bands.                                                                                          |
| `brightness`       | `number`                                           | `0.4`                                          | Shifts the balance between dark, mid and bright bands.                                                                                      |
| `flow`             | `number`                                           | `0`                                            | Drift speed of the field in cells per second. 0 evolves in place.                                                                           |
| `direction`        | `number`                                           | `0`                                            | Drift direction in degrees, used when `flow` is above 0.                                                                                    |
| `fade`             | `number`                                           | `0.25`                                         | Strength of the radial fade into the background towards the edges. 0 disables it.                                                           |
| `interactive`      | `boolean`                                          | `true`                                         | Lets the cursor splash into the field, sending ripples that cycle the glyphs and light them up.                                             |
| `splash-radius`    | `number`                                           | `40`                                           | Size of a cursor splash in CSS pixels.                                                                                                      |
| `splash-strength`  | `number`                                           | `0.4`                                          | How much energy a splash drops in. Higher values throw wider, brighter ripples.                                                             |
| `glow`             | `number`                                           | `0.35`                                         | Bloom on lit glyphs. 0 disables the glow pass entirely.                                                                                     |
| `intro`            | `boolean`                                          | `true`                                         | Plays a spawn animation on mount: the shapes pop in along a wave that travels from the centre to the corners.                               |
| `intro-duration`   | `number`                                           | `1.6`                                          | Length of the intro wave in seconds.                                                                                                        |
| `intro-key`        | `string \| number`                                 | `0`                                            | Change this value to replay the intro wave without remounting.                                                                              |
| `paused`           | `boolean`                                          | `false`                                        | Freezes the wave motion. Splashes keep working.                                                                                             |
| `class`            | `string`                                           | `''`                                           | Extra classes for the root element.                                                                                                         |

## Events

| Event   | Payload | Description                                                                              |
| ------- | ------- | ---------------------------------------------------------------------------------------- |
| `error` | `Error` | Emitted when WebGL2 is unavailable or rendering fails. The background color still shows. |

## Accessibility

The effect is decorative: the root is `aria-hidden` and ignores pointer events, so it never blocks content placed on top. Cursor splashes are read from window pointer moves. With `prefers-reduced-motion: reduce` the waves hold still and the intro is skipped, while splashes still respond. The render loop sleeps when the field is offscreen, the tab is hidden, or nothing is moving.

- Ported from [React Bits](https://reactbits.dev/backgrounds/shape-waves) by David Haz.
