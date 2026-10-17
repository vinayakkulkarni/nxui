---
title: MoltenMetal
description: Swirling caustic filaments with white-hot cores that heat up under the cursor and flare on click.
---

A WebGL2 background of folded caustic filaments that flow like molten metal. It ignites from its hottest cores outward when it first comes into view. Move the cursor to heat the filaments it passes and drift the flow, and click to flare them white-hot.

::demo-molten-metal
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/molten-metal.json"
```

## Usage

```vue
<script setup lang="ts">
  import MoltenMetal from '~/components/ui/molten-metal/MoltenMetal.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <MoltenMetal :colors="['#5227FF', '#FF9FFC']" color-mode="molten" />
  </div>
</template>
```

## Props

| Prop                | Type                             | Default                  | Description                                                                                              |
| ------------------- | -------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `colors`            | `string[]`                       | `['#5227FF', '#FF9FFC']` | Gradient the metal heats through, from the dim glow to the hot body. Up to five colors.                  |
| `core-color`        | `string`                         | `'#FFFFFF'`              | Color of the white-hot cores at the end of the gradient.                                                 |
| `background-color`  | `string`                         | `'transparent'`          | Fills the canvas behind the metal. Transparent lets the page show through.                               |
| `light-mode`        | `boolean`                        | `false`                  | Draws the flow as colored ink for light pages. Pair it with mid-tone colors that deepen toward the core. |
| `speed`             | `number`                         | `0.35`                   | How fast the metal flows.                                                                                |
| `scale`             | `number`                         | `4`                      | Zoom of the flow. Higher fits more of it on screen.                                                      |
| `detail`            | `number`                         | `3`                      | Layers of folded filaments, from 1 to 8. Fractions blend between layers.                                 |
| `glow`              | `number`                         | `1.6`                    | How much heat the filaments carry.                                                                       |
| `thickness`         | `number`                         | `1`                      | Width of the filaments and their white-hot cores.                                                        |
| `swirl`             | `number`                         | `1`                      | How tightly the flow spirals.                                                                            |
| `turbulence`        | `number`                         | `0.2`                    | How strongly each layer folds the flow.                                                                  |
| `haze`              | `number`                         | `0.75`                   | Soft glow between the filaments. 0 leaves only the filaments.                                            |
| `brightness`        | `number`                         | `1.3`                    | Overall brightness.                                                                                      |
| `color-mode`        | `'molten' \| 'ember' \| 'frost'` | `'molten'`               | Balance of the gradient. Ember runs hotter, frost stays cooler.                                          |
| `rotation`          | `number`                         | `0`                      | Rotation of the whole flow in degrees.                                                                   |
| `offset-x`          | `number`                         | `0`                      | Moves the flow sideways, as a fraction of the width.                                                     |
| `offset-y`          | `number`                         | `0`                      | Moves the flow up or down, as a fraction of the height.                                                  |
| `drift`             | `number`                         | `0.3`                    | How far the flow drifts as the cursor moves. 0 keeps it still.                                           |
| `grain`             | `number`                         | `0.05`                   | Film grain in the glow. 0 turns it off.                                                                  |
| `opacity`           | `number`                         | `1`                      | Opacity of the whole effect.                                                                             |
| `intro`             | `boolean`                        | `true`                   | Ignites the metal from its hottest cores outward the first time it comes into view.                      |
| `mouse-interaction` | `boolean`                        | `true`                   | The cursor heats the filaments it passes over, leaving a trail that slowly cools.                        |
| `mouse-strength`    | `number`                         | `0.5`                    | How hot the cursor runs.                                                                                 |
| `flare-on-click`    | `boolean`                        | `true`                   | Clicking flares the nearby filaments white-hot before they cool back down.                               |
| `paused`            | `boolean`                        | `false`                  | Freezes the flow.                                                                                        |
| `dpr`               | `number`                         | `2`                      | Maximum device pixel ratio of the canvas.                                                                |
| `class`             | `string`                         | `''`                     | Extra classes for the container.                                                                         |

## Accessibility

The canvas is decorative and hidden from assistive technology (`aria-hidden`). With `prefers-reduced-motion: reduce` the flow holds still, the intro is skipped, the cursor drift stops and clicks do not flare. Clicks on links, buttons and form controls placed over the background never trigger a flare. Rendering pauses while the effect is off screen.

- Ported from [React Bits](https://reactbits.dev/backgrounds/molten-metal) by David Haz.
