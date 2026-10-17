---
title: Evil Eye
description: A procedural evil eye shader with an animated iris, a slit pupil that follows the cursor, and a fiery outer glow.
---

A procedural evil eye drawn in one fragment shader with ogl. Flames flicker through the iris rings and the outer glow, driven by a tileable noise texture built on mount. Move the cursor over it and the slit pupil glides toward it. Light mode turns the glow into saturated ink over a light background.

::demo-evil-eye
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/evil-eye.json"
```

## Usage

```vue
<script setup lang="ts">
  import EvilEye from '~/components/ui/evil-eye/EvilEye.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <EvilEye
      eye-color="#FF6F37"
      background-color="#120F17"
      :intensity="1.5"
      :pupil-size="0.6"
      :iris-width="0.25"
      :glow-intensity="0.35"
      :scale="0.8"
      :pupil-follow="1"
      :flame-speed="1"
    />
  </div>
</template>
```

## Props

| Prop               | Type      | Default     | Description                                                   |
| ------------------ | --------- | ----------- | ------------------------------------------------------------- |
| `eye-color`        | `string`  | `'#FF6F37'` | Primary eye color in HEX format.                              |
| `intensity`        | `number`  | `1.5`       | Brightness / HDR intensity of the eye color.                  |
| `pupil-size`       | `number`  | `0.6`       | Size and darkness of the pupil slit.                          |
| `iris-width`       | `number`  | `0.25`      | Width of the main iris ring.                                  |
| `glow-intensity`   | `number`  | `0.35`      | Strength of the outer eye glow.                               |
| `scale`            | `number`  | `0.8`       | Zoom level of the eye. Values above 1 zoom in, below 1 out.   |
| `noise-scale`      | `number`  | `1`         | Scale of the fire/noise texture sampling.                     |
| `pupil-follow`     | `number`  | `1`         | Intensity of pupil cursor tracking. `0` disables it.          |
| `flame-speed`      | `number`  | `1`         | Independent flame flicker animation speed.                    |
| `background-color` | `string`  | `'#000000'` | Background color in HEX format.                               |
| `light-mode`       | `boolean` | `false`     | Draws the eye as saturated ink over a light background color. |
| `class`            | `string`  | `''`        | Extra classes merged on the container.                        |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- The pupil follows mouse movement over the container only; it never takes focus or blocks clicks.
- With `prefers-reduced-motion: reduce` the flames and the pupil hold still and the eye is drawn once.
- The render loop stops when the eye is offscreen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/backgrounds/evil-eye) by David Haz.
