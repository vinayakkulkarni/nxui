---
title: Micro Slats
description: A wall of tiny slats that becomes a rolling sea in perspective, with glinting crests.
---

A WebGL background that draws a grid of small rounded slats and lights them like a sea rolling in towards you, with bright glints on the crests. Pick a preset or tune each wave value. Move the cursor to stir a real fluid that bends the swell and leaves a trail of light, and click to spin out a splash.

::demo-micro-slats
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/micro-slats.json"
```

## Usage

```vue
<script setup lang="ts">
  import MicroSlats from '~/components/ui/micro-slats/MicroSlats.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <MicroSlats
      preset="swell"
      color="#A855F7"
      glint-color="#ffffff"
      background-color="#120f17"
      :slat-width="10"
      :slat-height="25"
      :gap="3"
      :roundness="0.75"
    />
  </div>
</template>
```

## Presets

| Preset   | Look                                                |
| -------- | --------------------------------------------------- |
| `swell`  | Long, calm waves rolling towards the viewer.        |
| `tide`   | Slow, low-chop water with a little slat stretch.    |
| `storm`  | Short, steep, bright waves with deep perspective.   |
| `signal` | A flat wall with no perspective, like an equalizer. |

Any wave prop you pass overrides the preset value.

## Props

| Prop               | Type                                       | Default     | Description                                                                 |
| ------------------ | ------------------------------------------ | ----------- | --------------------------------------------------------------------------- |
| `preset`           | `'swell' \| 'tide' \| 'storm' \| 'signal'` | `'swell'`   | A starting look for the sea. Every wave prop below overrides it.            |
| `color`            | `string`                                   | `'#A855F7'` | Color of the slats.                                                         |
| `glint-color`      | `string`                                   | `'#ffffff'` | Color the slats shift towards on crests and in the light the cursor leaves. |
| `background-color` | `string`                                   | `'#000000'` | Color behind the slats. Pass `transparent` to show the page through.        |
| `slat-width`       | `number`                                   | `10`        | Width of one slat in CSS pixels.                                            |
| `slat-height`      | `number`                                   | `25`        | Full height of one slat in CSS pixels.                                      |
| `gap`              | `number`                                   | `3`         | Space between slats in CSS pixels.                                          |
| `roundness`        | `number`                                   | `0.75`      | Corner rounding, from square at 0 to a full pill at 1.                      |
| `scale`            | `number`                                   | from preset | Size of the swell. Larger values give longer, calmer waves.                 |
| `speed`            | `number`                                   | from preset | How fast the waves roll. 0 freezes the sea while the cursor can stir it.    |
| `direction`        | `number`                                   | from preset | Heading of the swell in degrees. 270 rolls straight towards the viewer.     |
| `chop`             | `number`                                   | from preset | Sharpens the crests and flattens the troughs, like wind on the water.       |
| `stretch`          | `number`                                   | from preset | How much each slat grows and shrinks with the wave under it.                |
| `glint`            | `number`                                   | from preset | Strength of the light caught on the crests.                                 |
| `contrast`         | `number`                                   | from preset | Spread between dark troughs and bright crests.                              |
| `perspective`      | `number`                                   | from preset | How far the sea recedes towards a horizon above the top edge. 0 is flat.    |
| `fog`              | `number`                                   | from preset | Haze that fades the far rows into the background.                           |
| `interactive`      | `boolean`                                  | `true`      | Lets the cursor stir the water. A click spins out a splash.                 |
| `cursor-strength`  | `number`                                   | `1`         | Brightness of the light the cursor leaves in the water.                     |
| `cursor-size`      | `number`                                   | `40`        | Radius of the patch of water the cursor pushes, in CSS pixels.              |
| `swirl`            | `number`                                   | `0`         | How strongly the stirred water curls into eddies.                           |
| `trail`            | `number`                                   | `1.4`       | How long the stirred water and its light linger, in seconds.                |
| `lean`             | `number`                                   | `0`         | How far the slats tilt with the current. 0 keeps them upright.              |
| `intro`            | `boolean`                                  | `true`      | Rolls the sea in from the horizon on mount, unfolding the slats row by row. |
| `intro-duration`   | `number`                                   | `1.5`       | Length of the intro in seconds.                                             |
| `paused`           | `boolean`                                  | `false`     | Freezes the waves. The cursor can still stir the water.                     |
| `class`            | `string`                                   | `''`        | Extra classes for the root element.                                         |
| `style`            | `StyleValue`                               | —           | Inline styles for the root element.                                         |

## Accessibility

- The canvas is decorative and hidden from assistive technology (`aria-hidden`).
- With `prefers-reduced-motion: reduce` the waves and the intro stay still and the cursor does not stir the water.
- The animation pauses while the component is offscreen or the tab is hidden.
- Pointer listeners are passive and never block page scrolling.

- Ported from [React Bits](https://reactbits.dev/backgrounds/micro-slats) by David Haz.
