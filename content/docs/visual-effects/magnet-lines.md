---
title: Magnet Lines
description: A field of magnetic lines that swing toward the cursor, ripple outward and spin with every click.
---

A WebGL2 field of lines that fills its container. Move the cursor and every line swings on a spring to follow it, with the motion rippling outward from the pointer. Click to send a ring that spins the lines as it travels. Pick a field mode (orbit, attract, spiral, dipole), draw lines as bars, arrows or compass needles, and tilt the plane in 3D.

::demo-magnet-lines
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magnet-lines.json"
```

## Usage

```vue
<script setup lang="ts">
  import MagnetLines from '~/components/ui/magnet-lines/MagnetLines.vue';
</script>

<template>
  <!-- Fills its parent -->
  <div class="relative h-150 w-full">
    <MagnetLines mode="orbit" line-color="#efefef" :spacing="30" />
  </div>

  <!-- Fixed square field -->
  <MagnetLines
    container-size="min(440px, 86%)"
    mode="attract"
    shape="needle"
    accent-color="#f43f5e"
    :spacing="56"
    :line-height="34"
  />
</template>
```

All lines are drawn in one instanced draw call. The render loop sleeps when
nothing moves, when the field is off screen, and when the tab is hidden.

## Props

| Prop                     | Type                                           | Default     | Description                                                                                                    |
| ------------------------ | ---------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `spacing`                | `number`                                       | `30`        | Distance between lines in px. The grid fills the area with as many lines as fit.                               |
| `rows`                   | `number`                                       | —           | Exact number of rows. Overrides `spacing`.                                                                     |
| `columns`                | `number`                                       | —           | Exact number of columns. Overrides `spacing`.                                                                  |
| `container-size`         | `number \| string`                             | —           | Draws a square field of this width instead of filling the parent. Numbers are px; strings take any CSS length. |
| `line-color`             | `string`                                       | `'#efefef'` | Color of the lines.                                                                                            |
| `accent-color`           | `string`                                       | —           | Color lines take on near the cursor. Compass needles use it for their north half.                              |
| `line-width`             | `number \| string`                             | `2`         | Thickness of each line. Numbers are px; strings take any CSS length.                                           |
| `line-height`            | `number \| string`                             | `18`        | Length of each line. Numbers are px; strings take any CSS length.                                              |
| `base-angle`             | `number`                                       | `-10`       | Resting angle in degrees, used before the intro and outside the reach.                                         |
| `mode`                   | `'orbit' \| 'attract' \| 'spiral' \| 'dipole'` | `'orbit'`   | Rings around the cursor, lines aiming at it, a vortex, or a bar magnet that turns with your movement.          |
| `shape`                  | `'line' \| 'arrow' \| 'needle'`                | `'line'`    | Rounded bar, arrow showing the field direction, or two-tone compass needle.                                    |
| `rainbow`                | `boolean`                                      | `false`     | Colors every line by the direction it points, so the field becomes a color wheel.                              |
| `radius`                 | `number`                                       | `200`       | Size of the area around the cursor where lines are brightest and longest, in px.                               |
| `fade`                   | `number`                                       | `0.65`      | How much lines dim away from the cursor, 0 to 1. 0 keeps every line at full strength.                          |
| `edge-fade`              | `number`                                       | `0`         | Fades the edges into the page, 0 to 1.                                                                         |
| `stretch`                | `number`                                       | `0.4`       | How much lines grow near the cursor, 0 to 2.                                                                   |
| `reach`                  | `number`                                       | `0`         | Distance in px within which lines follow the cursor. Farther lines settle back. 0 means every line follows.    |
| `scatter`                | `number`                                       | `0`         | Randomizes each line's resting angle, 0 to 1, like loose iron filings. Pairs well with `reach`.                |
| `inertia`                | `number`                                       | `0.35`      | How slowly the lines swing into place, 0 to 1. 0 snaps them instantly.                                         |
| `bounce`                 | `number`                                       | `0.3`       | How much the lines overshoot and wobble as they settle, 0 to 1.                                                |
| `ripple`                 | `number`                                       | `0.3`       | Delays lines by their distance from the cursor so movement ripples outward, 0 to 1.                            |
| `click-pulse`            | `boolean`                                      | `true`      | Clicking sends a ring that spins the lines as it travels outward.                                              |
| `intro`                  | `boolean`                                      | `true`      | Lines fade in from the center and swing into place on mount.                                                   |
| `idle`                   | `boolean`                                      | `false`     | Moves the field on its own when the cursor is away.                                                            |
| `tilt-x`                 | `number`                                       | `0`         | Tilts the field back in 3D around the horizontal axis, in degrees. A full-size field stretches to the horizon. |
| `tilt-y`                 | `number`                                       | `0`         | Tilts the field in 3D around the vertical axis, in degrees.                                                    |
| `max-device-pixel-ratio` | `number`                                       | `2`         | Highest pixel ratio the canvas renders at.                                                                     |
| `class`                  | `string`                                       | `''`        | Extra classes merged onto the container.                                                                       |

## Accessibility

- The canvas is decorative (`aria-hidden="true"`) and never captures pointer events, so content layered on top stays clickable.
- With `prefers-reduced-motion: reduce`, the intro, idle drift, click pulses, springs and ripple lag are all turned off; lines snap straight to the field.

- Ported from [React Bits](https://reactbits.dev/backgrounds/magnet-lines) by David Haz.
