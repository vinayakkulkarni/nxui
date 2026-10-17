---
title: Iridescence
description: Liquid iridescent surface with shifting folds that you can stir with the cursor.
---

A liquid iridescent surface of folded color layers, drawn in one raw WebGL2 shader. Drag the cursor across it and the folds stir along like a liquid while a soft sheen follows the pointer; click to stir in a swirl that slowly unwinds. Color, folds and motion are all tunable. Pick a preset in the demo panel, from Pearl to Chrome, Graphite and Oil.

::demo-iridescence
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/iridescence.json"
```

## Usage

```vue
<script setup lang="ts">
  import Iridescence from '~/components/ui/iridescence/Iridescence.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Iridescence
      color="#8099cc"
      :brightness="1.5"
      :stir="0.5"
      :sheen="0.3"
      :click-swirl="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `iridescencePreset('chrome')` returns the look of the Classic, Pearl, Chrome, Graphite or Oil preset.

## Props

| Prop          | Type                 | Default     | Description                                                                  |
| ------------- | -------------------- | ----------- | ---------------------------------------------------------------------------- |
| `color`       | `string \| number[]` | `[1, 1, 1]` | Tint multiplied over the colors. Any CSS color, or an RGB array from 0 to 1. |
| `hue-shift`   | `number`             | `0`         | Rotates the hues, in degrees.                                                |
| `saturation`  | `number`             | `1`         | Color intensity. 0 gives a monochrome chrome look.                           |
| `brightness`  | `number`             | `1.5`       | Overall brightness.                                                          |
| `contrast`    | `number`             | `1`         | Contrast between the folds.                                                  |
| `speed`       | `number`             | `1`         | Animation speed. 0 holds the pattern still.                                  |
| `scale`       | `number`             | `1`         | Size of the pattern. Higher values give broader folds.                       |
| `detail`      | `number`             | `8`         | How many layers of folds are stacked, from 1 to 24.                          |
| `warp`        | `number`             | `1`         | How strongly the folds bend into each other.                                 |
| `rotation`    | `number`             | `0`         | Rotation of the pattern in degrees.                                          |
| `mouse-react` | `boolean`            | `true`      | Turns the pointer interactions on or off: parallax, stir and sheen.          |
| `amplitude`   | `number`             | `0.1`       | How far the pattern drifts toward the pointer.                               |
| `stir`        | `number`             | `0.5`       | Drags the folds along with the pointer like a liquid. 0 turns it off.        |
| `sheen`       | `number`             | `0.3`       | Brightens the surface softly around the pointer.                             |
| `click-swirl` | `boolean`            | `true`      | Stirs a swirl into the surface wherever you click, which slowly unwinds.     |
| `grain`       | `number`             | `0`         | Film grain over the surface, from 0 to 1.                                    |
| `fade`        | `number`             | `0`         | Fades the edges into the page, from 0 to 1.                                  |
| `opacity`     | `number`             | `1`         | Opacity of the whole effect.                                                 |
| `resolution`  | `number`             | `1`         | Render scale, from 0.1 to 2. Lower values trade sharpness for speed.         |
| `paused`      | `boolean`            | `false`     | Freezes the animation.                                                       |
| `class`       | `string`             | `''`        | Extra classes merged on the container.                                       |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- Pointer listeners are passive and sit on `window`, so clicks still reach content above the surface.
- With `prefers-reduced-motion: reduce` the surface holds still and there is no stir or swirl. The sheen still follows the pointer.
- The render loop stops when the surface is paused and settled, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/iridescence) by David Haz.
