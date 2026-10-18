---
title: CRT Warp
description: A blocky plasma glowing on a curved CRT, with real scanlines, a phosphor mask, afterglow and a power-on intro.
---

CRT Warp draws a low-resolution plasma on a curved glass tube, with scanlines, a phosphor mask, afterglow trails and bloom. The tube warms up into view, the cursor bends the picture like a magnet held to the glass, and a click changes the channel.

::demo-crt-warp
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/crt-warp.json"
```

## Usage

```vue
<script setup lang="ts">
  import CrtWarp from '~/components/ui/crt-warp/CrtWarp.vue';
</script>

<template>
  <div class="relative size-full min-h-80 overflow-hidden">
    <CrtWarp
      class="absolute inset-0 size-full"
      color="#c755f7"
      background-color="#120f17"
      mask="aperture"
      :speed="0.5"
      :columns="80"
      :curvature="0.25"
    />
  </div>
</template>
```

The demo presets (Ultraviolet, Amber, Oscilloscope, Arcade, Interference) ship with the component. `crtWarpPreset('amber')` returns the full set of visual props; pass `true` as the second argument for the light-background variant.

```vue
<script setup lang="ts">
  import { CrtWarp, crtWarpPreset } from '~/components/ui/crt-warp';

  const amber = crtWarpPreset('amber');
</script>

<template>
  <CrtWarp v-bind="amber" />
</template>
```

## Props

| Prop                 | Type                                         | Default      | Description                                                                                             |
| -------------------- | -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| `color`              | `string`                                     | `'#c755f7'`  | Phosphor color of the picture.                                                                          |
| `background-color`   | `string`                                     | `'#120f17'`  | Color of the dark tube behind the picture. Use `'transparent'` to let the page show through.            |
| `light-mode`         | `boolean`                                    | `false`      | Prints the picture as ink on a light background instead of glowing phosphor.                            |
| `mask`               | `'aperture' \| 'shadow' \| 'slot' \| 'none'` | `'aperture'` | The phosphor pattern of the tube: vertical stripes, dot triads, slots, or a plain mono tube.            |
| `speed`              | `number`                                     | `0.5`        | How fast the plasma flows.                                                                              |
| `variation`          | `number`                                     | `0`          | Picks a different plasma pattern. Each whole number is a new one.                                       |
| `wave-amplitude`     | `number`                                     | `0.3`        | How tightly the plasma folds into bands.                                                                |
| `wave-frequency`     | `number`                                     | `2.5`        | How many blobs fit on screen.                                                                           |
| `levels`             | `number`                                     | `3`          | Number of brightness steps in the picture.                                                              |
| `columns`            | `number`                                     | `80`         | Width of the low resolution picture in blocks. Fewer columns make chunkier blocks.                      |
| `persistence`        | `number`                                     | `0.4`        | How long the phosphor keeps glowing after the picture moves on, leaving soft trails.                    |
| `curvature`          | `number`                                     | `0.25`       | Bulge of the curved glass.                                                                              |
| `corners`            | `number`                                     | `0`          | Rounds the corners of the tube and shows its edge. 0 keeps the picture edge to edge.                    |
| `scanline-strength`  | `number`                                     | `0.6`        | Depth of the dark gaps between scanlines. Bright lines widen and fill the gaps.                         |
| `scanline-frequency` | `number`                                     | `200`        | Number of scanlines from top to bottom.                                                                 |
| `mask-strength`      | `number`                                     | `0.3`        | Visibility of the phosphor mask.                                                                        |
| `bloom`              | `number`                                     | `1.5`        | Glow that spills from bright areas.                                                                     |
| `bloom-radius`       | `number`                                     | `1`          | How far the glow spreads.                                                                               |
| `rgb-shift`          | `number`                                     | `0.003`      | Misalignment of the red and blue beams, which fringes edges with color.                                 |
| `noise`              | `number`                                     | `0.1`        | Grain in the lit picture.                                                                               |
| `flicker`            | `number`                                     | `0.15`       | Brightness flicker of the tube.                                                                         |
| `interference`       | `number`                                     | `0.2`        | A slow hum bar rolling down the screen and jitter along the lines.                                      |
| `vignette`           | `number`                                     | `0.3`        | Darkening toward the edges of the tube.                                                                 |
| `brightness`         | `number`                                     | `1`          | Overall brightness, or ink strength in light mode.                                                      |
| `intro`              | `boolean`                                    | `true`       | Warms the tube up when it first comes into view: the plasma grows out of the dark and pulls into focus. |
| `mouse-react`        | `boolean`                                    | `true`       | The cursor acts like a magnet held to the glass, twisting the picture with color fringes.               |
| `mouse-strength`     | `number`                                     | `0.5`        | Strength of the magnet.                                                                                 |
| `change-on-click`    | `boolean`                                    | `true`       | Clicking changes the channel: the picture rolls through static and comes back with a new pattern.       |
| `dpr`                | `number`                                     | `2`          | Maximum device pixel ratio of the canvas.                                                               |
| `fps`                | `number`                                     | `60`         | Maximum frame rate.                                                                                     |
| `paused`             | `boolean`                                    | `false`      | Freezes the plasma.                                                                                     |
| `class`              | `string`                                     | `''`         | Extra class names for the container.                                                                    |

## Accessibility

- The canvas is decorative and marked `aria-hidden`, so screen readers skip it. Put real content on top of it.
- Clicks on links, buttons, inputs, labels and `[role="button"]` elements never flip the channel, so content placed over the tube keeps working.
- With `prefers-reduced-motion: reduce`, the plasma stops flowing, the intro, flicker and magnet are skipped, and a click changes the channel at once without the rolling static.
- Rendering pauses while the tube is offscreen or the tab is hidden, and stops redrawing once a paused picture has settled.

- Ported from [React Bits](https://reactbits.dev/backgrounds/crt-warp) by David Haz.
