---
title: Magic Rings
description: Glowing rings that pulse outward in a wave, swell toward the cursor and flare on click.
---

Concentric rings of light drawn with raw WebGL2. They pulse outward in a wave, ripple from the center or breathe together. Hover to make them swell and lean toward the cursor, click to send a bright ring racing outward, and use `tilt`, `spin` and `dispersion` for 3D portals, gyroscopes and prism fringes. No extra dependencies.

::demo-magic-rings
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magic-rings.json"
```

## Usage

```vue
<script setup lang="ts">
  import MagicRings from '~/components/ui/magic-rings/MagicRings.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <MagicRings
      color="#A855F7"
      color-two="#6366F1"
      :ring-count="6"
      motion="pulse"
      :line-thickness="2"
      :glow="1"
      click-burst
    />
  </div>
</template>
```

The canvas is transparent, so the page background shows through. On light pages pass `theme="light"`: the rings are drawn as crisp ink with a soft halo instead of additive light, so pick darker colors.

## Props

| Prop                     | Type                               | Default     | Description                                                                             |
| ------------------------ | ---------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `color`                  | `string`                           | `'#A855F7'` | Color of the innermost ring.                                                            |
| `color-two`              | `string`                           | `'#6366F1'` | Color of the outermost ring. The rings in between blend from one to the other.          |
| `ring-count`             | `number`                           | `6`         | Number of rings, from 1 to 12.                                                          |
| `motion`                 | `'pulse' \| 'ripple' \| 'breathe'` | `'pulse'`   | A wave that lights the rings one by one, rings flowing outward, or all rings breathing. |
| `speed`                  | `number`                           | `1`         | Animation speed. `0` freezes the rings.                                                 |
| `line-thickness`         | `number`                           | `2`         | Thickness of the rings in px. Rings are thickest at the sides and taper at the ends.    |
| `glow`                   | `number`                           | `1`         | Size and strength of the glow around the rings.                                         |
| `base-radius`            | `number`                           | `0.35`      | Radius of the innermost ring, as a share of the smaller side of the container.          |
| `radius-step`            | `number`                           | `0.1`       | Space between neighboring rings.                                                        |
| `expansion`              | `number`                           | `0.1`       | How far each ring drifts outward while it glows.                                        |
| `taper`                  | `number`                           | `1.5`       | How quickly outer rings shorten into side arcs. `1` keeps every ring the same length.   |
| `rotation`               | `number`                           | `0`         | Rotates the whole pattern, in degrees.                                                  |
| `spin`                   | `number`                           | `0`         | Spins the arcs, neighbors turning in opposite directions. Negative values reverse it.   |
| `tilt`                   | `number`                           | `0`         | Leans the rings back in 3D, in degrees, like a portal seen at an angle.                 |
| `dispersion`             | `number`                           | `0`         | Splits each ring into rainbow fringes like light through a prism, from 0 to 1.          |
| `grain`                  | `number`                           | `0`         | Film grain over the glow, from 0 to 1.                                                  |
| `opacity`                | `number`                           | `1`         | Overall opacity, from 0 to 1.                                                           |
| `follow-mouse`           | `boolean`                          | `false`     | The rings drift toward the cursor.                                                      |
| `mouse-influence`        | `number`                           | `0.2`       | How far the rings drift when `follow-mouse` is on.                                      |
| `hover-scale`            | `number`                           | `1.2`       | How much the rings swell on hover.                                                      |
| `hover-intensity`        | `number`                           | `1`         | How much the rings brighten and thicken near the cursor.                                |
| `parallax`               | `number`                           | `0.05`      | How much the rings shift and lean with the cursor, outer rings the most.                |
| `click-burst`            | `boolean`                          | `true`      | Clicking sends a bright ring racing outward that lights up the rings as it passes.      |
| `intro`                  | `boolean`                          | `true`      | The rings open from the sides one by one when they mount.                               |
| `theme`                  | `'dark' \| 'light'`                | `'dark'`    | Glowing light for dark pages, or crisp ink with a soft halo for light ones.             |
| `max-device-pixel-ratio` | `number`                           | `2`         | Highest pixel ratio the canvas renders at.                                              |
| `class`                  | `string`                           | `''`        | Extra classes for the container.                                                        |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Put real content on top of it; the canvas ignores pointer events, so links and buttons above it stay clickable.
- With `prefers-reduced-motion: reduce` the rings stand still, the intro and click bursts are skipped, and hover no longer moves them.
- Rendering stops while the component is off screen, the tab is hidden, or nothing is moving (`speed` 0 with no hover).

- Ported from [React Bits](https://reactbits.dev/backgrounds/magic-rings) by David Haz.
