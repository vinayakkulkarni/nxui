---
title: Noise
description: Film grain overlay for photos and pages, from fine 35mm grain to dust, scratches, paper and TV static.
---

Noise lays animated film grain over whatever sits under it. One small grain tile is painted once and jittered every frame, so it stays light even at full screen. Add dust, hairs, vertical scratches, scanlines and flicker for an old film print, or set `fps` to 0 for a still paper texture. Use the panel to try the presets.

::demo-noise
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/noise.json"
```

## Usage

The overlay fills its nearest positioned parent (`position: absolute; inset: 0`) and never blocks pointer events.

```vue
<script setup lang="ts">
  import Noise from '~/components/ui/noise/Noise.vue';
</script>

<template>
  <div class="relative h-125 overflow-hidden">
    <img src="/photo.jpg" alt="" class="size-full object-cover" />
    <Noise
      :opacity="0.16"
      :fps="18"
      :dust="0.55"
      :scratches="0.5"
      :flicker="0.25"
    />
  </div>
</template>
```

## Props

| Prop         | Type                                                                              | Default     | Description                                                                         |
| ------------ | --------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `opacity`    | `number`                                                                          | `0.2`       | Strength of the grain, from 0 to 1.                                                 |
| `size`       | `number`                                                                          | `1`         | Size of each grain in CSS pixels. 0.5 is one device pixel on retina screens.        |
| `fps`        | `number`                                                                          | `24`        | How many times per second the grain changes. 0 keeps it still, like paper.          |
| `blend-mode` | `'normal' \| 'overlay' \| 'soft-light' \| 'multiply' \| 'screen' \| 'difference'` | `'overlay'` | How the grain mixes with what is underneath. Overlay and soft light keep the color. |
| `contrast`   | `number`                                                                          | `0.6`       | From soft, fine grain at 0 to harsh, punchy grain at 1.                             |
| `dust`       | `number`                                                                          | `0`         | Specks, hairs and fibers that flicker over the frame, from 0 to 1.                  |
| `scratches`  | `number`                                                                          | `0`         | How often thin vertical scratches run down the frame for a few seconds, 0 to 1.     |
| `colored`    | `boolean`                                                                         | `false`     | Uses colored grain instead of gray.                                                 |
| `scanlines`  | `number`                                                                          | `0`         | Adds rolling horizontal lines, like an old screen, from 0 to 1.                     |
| `flicker`    | `number`                                                                          | `0`         | Makes the grain strength jump a little every frame, like a film projector.          |
| `fixed`      | `boolean`                                                                         | `false`     | Covers the whole viewport instead of the nearest positioned parent.                 |
| `z-index`    | `number`                                                                          | `-`         | Stacking order of the overlay.                                                      |
| `class`      | `string`                                                                          | `''`        | Extra classes for the overlay.                                                      |

## Accessibility

- The overlay is decorative (`aria-hidden="true"`) and uses `pointer-events: none`, so it never blocks clicks, focus or text selection.
- With `prefers-reduced-motion: reduce` the grain is drawn once and stays still.
- The animation loop stops while the overlay is offscreen.

- Ported from [React Bits](https://reactbits.dev/animations/noise) by David Haz.
