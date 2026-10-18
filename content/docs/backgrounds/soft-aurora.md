---
title: Soft Aurora
description: Soft aurora band built from 3D Perlin noise that reaches toward the cursor and carries click pulses.
---

A soft aurora band drawn from two layers of 3D Perlin noise and tinted with cosine gradient palettes, in one raw WebGL2 shader. It blooms in from a thin line on mount. Bring the cursor close and the band reaches toward it; click to send a pulse of light along it. `light-mode` prints it as soft colored ink for light pages. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-soft-aurora
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/soft-aurora.json"
```

## Usage

```vue
<script setup lang="ts">
  import SoftAurora from '~/components/ui/soft-aurora/SoftAurora.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <SoftAurora
      color1="#f7f7f7"
      color2="#e100ff"
      :speed="0.6"
      :band-height="0.5"
      :click-pulse="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `softAuroraPreset('borealis')` returns the look of the Classic, Borealis, Dusk, Mono, Ribbon, Halo or Calm preset. Pass `true` as the second argument to get the light-page colors.

## Props

| Prop                       | Type      | Default     | Description                                                                  |
| -------------------------- | --------- | ----------- | ---------------------------------------------------------------------------- |
| `color1`                   | `string`  | `'#f7f7f7'` | Tint of the first aurora layer. Hex or `rgb()`.                              |
| `color2`                   | `string`  | `'#e100ff'` | Tint of the second aurora layer. Hex or `rgb()`.                             |
| `spectrum`                 | `number`  | `1`         | How much of the shifting rainbow shows through the tints. 0 uses the colors. |
| `speed`                    | `number`  | `0.6`       | Overall animation speed.                                                     |
| `color-speed`              | `number`  | `1`         | How fast the colors drift along the band.                                    |
| `scale`                    | `number`  | `1.5`       | Scale of the noise that shapes the band.                                     |
| `brightness`               | `number`  | `1`         | Overall brightness.                                                          |
| `noise-frequency`          | `number`  | `2.5`       | How tightly the band ripples.                                                |
| `noise-amplitude`          | `number`  | `1`         | How far the band waves up and down.                                          |
| `band-height`              | `number`  | `0.5`       | Vertical position of the band, from 0 at the bottom to 1 at the top.         |
| `band-spread`              | `number`  | `1`         | How tight and bright the band is. Lower values spread it into a soft glow.   |
| `tilt`                     | `number`  | `0`         | Tilts the band by this many degrees.                                         |
| `octave-decay`             | `number`  | `0.1`       | How much fine ripple sits on top of the large waves.                         |
| `layer-offset`             | `number`  | `0`         | Shifts the second layer in time so the two separate.                         |
| `enable-mouse-interaction` | `boolean` | `true`      | The aurora drifts with the cursor and reaches toward it when it comes close. |
| `mouse-influence`          | `number`  | `0.25`      | Strength of the cursor drift and reach.                                      |
| `click-pulse`              | `boolean` | `true`      | Clicking sends a soft pulse of light along the band.                         |
| `intro`                    | `boolean` | `true`      | The band starts as a thin line and blooms in on mount.                       |
| `light-mode`               | `boolean` | `false`     | Prints the aurora as soft colored ink so it sits on light pages.             |
| `opacity`                  | `number`  | `1`         | Overall opacity, from 0 to 1.                                                |
| `class`                    | `string`  | `''`        | Extra classes merged on the container.                                       |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- Pointer listeners are passive and sit on `window`, so clicks still reach content above the aurora.
- With `prefers-reduced-motion: reduce` there is no intro and no click pulse, and the aurora drifts at a third of its speed.
- The render loop stops when the aurora is settled, offscreen or in a hidden tab, and it recovers from a lost WebGL context.

- Ported from [React Bits](https://reactbits.dev/backgrounds/soft-aurora) by David Haz.
