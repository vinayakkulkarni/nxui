---
title: Ghost Fibers
description: Layered ribbons of fine glowing fibers that twist, fold and drift through soft depth of field.
---

A WebGL2 background of up to three ribbons, each made of many fine fibers drawn as dots, dashes or lines. The ribbons twist and roll, the camera blurs what is out of focus, and bloom lights the folds. Move the cursor to pull the focus onto the ribbon under it (or part the fibers around it), and click a ribbon to send a pulse of light along it.

::demo-ghost-fibers
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ghost-fibers.json"
```

## Usage

```vue
<script setup lang="ts">
  import GhostFibers from '~/components/ui/ghost-fibers/GhostFibers.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-black">
    <GhostFibers
      glow-color="#8b5cf6"
      line-color="#dfd1fc"
      secondary-color="#6f4ac5"
      :layers="3"
      :threads="72"
      hover-effect="focus"
    />
  </div>
</template>
```

The effect is additive light, so it reads best on a dark background. On a light background set `light-mode`; the fibers are then drawn as colored ink, and darker colors such as `#7c3aed` / `#4c1d95` work best. The demo switches to this mode when the site is in light theme.

## Props

| Prop                | Type                             | Default     | Description                                                                                    |
| ------------------- | -------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `glow-color`        | `string`                         | `'#8b5cf6'` | Main color of the fibers.                                                                      |
| `line-color`        | `string`                         | —           | Color of the bright folds, sparkles and tips. Leave out to use a pale tint of the glow color.  |
| `secondary-color`   | `string`                         | —           | Second color the gradient blends toward. Leave out to use a deeper shade of the glow color.    |
| `gradient`          | `'depth' \| 'along' \| 'across'` | `'depth'`   | How the two colors blend: by distance, along the length of the ribbons, or across their width. |
| `layers`            | `number`                         | `3`         | Number of ribbons, from 1 to 3.                                                                |
| `waves`             | `number`                         | `1`         | How much the ribbons undulate. 0 keeps them straight.                                          |
| `twist`             | `number`                         | `1.2`       | How often the ribbons turn over along their length.                                            |
| `volume`            | `number`                         | `0.7`       | Thickness of each ribbon, from a single flat sheet at 0 to a layered bundle.                   |
| `spread`            | `number`                         | `1`         | Width of the ribbons.                                                                          |
| `scale`             | `number`                         | `1`         | Size of the whole effect.                                                                      |
| `rotation`          | `number`                         | `18`        | Tilt of the whole effect, in degrees.                                                          |
| `perspective`       | `number`                         | `0.65`      | How far the ribbons turn into the distance, from side-on at 0 to steeply receding at 1.        |
| `threads`           | `number`                         | `72`        | Number of fibers in each ribbon.                                                               |
| `density`           | `number`                         | `1`         | Number of dots along each fiber.                                                               |
| `thickness`         | `number`                         | `1`         | Size of the dots.                                                                              |
| `fiber-style`       | `'dots' \| 'dashes' \| 'lines'`  | `'dots'`    | Draws the fibers as rows of dots, short dashes or continuous lines.                            |
| `tips`              | `number`                         | `0`         | Cuts the fibers at different lengths and lights their ends, like fiber optics.                 |
| `fold-glow`         | `number`                         | `1`         | Brightness of the light where the ribbons fold edge-on.                                        |
| `speed`             | `number`                         | `0.5`       | Speed of the waves and the twist. 0 holds them still.                                          |
| `flow`              | `number`                         | `0.4`       | Speed of the dots along the fibers. Negative values reverse them.                              |
| `roll-speed`        | `number`                         | `0.15`      | How fast the ribbons roll around their length.                                                 |
| `depth-of-field`    | `number`                         | `0.85`      | Strength of the camera blur away from the focus. 0 keeps everything sharp.                     |
| `focus-depth`       | `number`                         | `0`         | Moves the focus nearer with negative values or farther with positive ones.                     |
| `particles`         | `number`                         | `0.5`       | Amount of dust floating around the ribbons.                                                    |
| `sparkle`           | `number`                         | `0.5`       | How often single dots twinkle.                                                                 |
| `glow`              | `number`                         | `0.8`       | Strength of the bloom around the bright areas.                                                 |
| `brightness`        | `number`                         | `1`         | Overall brightness.                                                                            |
| `vignette`          | `number`                         | `0.3`       | How much the edges fade out, from 0 to 1.                                                      |
| `grain`             | `number`                         | `0.06`      | Strength of the film grain.                                                                    |
| `mouse-interaction` | `boolean`                        | `true`      | Lets the view follow the cursor slightly and turns on the hover effect.                        |
| `hover-effect`      | `'focus' \| 'part' \| 'none'`    | `'focus'`   | Pulls the focus to the ribbon under the cursor, parts the fibers around it, or does nothing.   |
| `mouse-strength`    | `number`                         | `1`         | Strength of the hover effect.                                                                  |
| `pulse-on-click`    | `boolean`                        | `true`      | Sends a pulse of light along the ribbon you click.                                             |
| `intro`             | `boolean`                        | `true`      | Draws the ribbons in from one end when the effect first appears.                               |
| `light-mode`        | `boolean`                        | `false`     | Draws the fibers as colored ink for light backgrounds.                                         |
| `paused`            | `boolean`                        | `false`     | Freezes the animation.                                                                         |
| `dpr`               | `number`                         | auto        | Maximum device pixel ratio, capped at 2.                                                       |
| `class`             | `string`                         | `''`        | Extra classes for the container.                                                               |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce`, the animation and intro stop, and the hover and click effects are off.
- Clicks on links, buttons, inputs and labels on top of the effect do not trigger a pulse.
- Rendering pauses while the effect is offscreen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/backgrounds/ghost-fibers) by David Haz.
