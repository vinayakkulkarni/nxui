---
title: Pixel Wave
description: A looping pixel-art ocean swell rendered on a dark LED grid of colored patches.
---

::demo-pixel-wave
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-wave.json"
```

## Usage

```vue
<script setup lang="ts">
  import PixelWave from '~/components/ui/pixel-wave/PixelWave.vue';
</script>

<template>
  <div class="bg-neutral-950">
    <PixelWave class="h-100" />
    <h2>A Wave From Tahiti</h2>
    <p>Faded memories of wave breaks, rendered in pixel patches.</p>
  </div>
</template>
```

A fixed 20×19 grid of square cells renders a rolling ocean swell. The grid
never moves — the animation is pure cell-state: foam, turquoise crest, teal,
ocean blue and deep navy bands turn on and off as two travelling sine layers
morph the waterline through crest, trough, a near-black fade window, and a
rebuild before the loop restarts. Empty cells keep a faint LED outline, so
the display reads as a pixel patch panel even when the wave is gone.

The canvas sizes itself to its container (cells scale to fit), honors
`prefers-reduced-motion` by freezing on a static frame, and reports the
current swell phase through the `phase` event so you can drive captions or
accessibility status text.

## Props

| Prop               | Type      | Default | Description                               |
| ------------------ | --------- | ------- | ----------------------------------------- |
| `speed`            | `number`  | `1`     | Animation speed multiplier                |
| `vertical-padding` | `number`  | `0`     | Extra empty rows above and below the grid |
| `animate`          | `boolean` | `true`  | Run the looping swell animation           |

## Events

| Event   | Payload          | Description                                                                   |
| ------- | ---------------- | ----------------------------------------------------------------------------- |
| `phase` | `PixelWavePhase` | Fired when the loop enters a new phase (`crest`, `trough`, `fade`, `rebuild`) |

## Credits

Inspired by a pixel-patch ocean wave experiment shared in the Vue community.
