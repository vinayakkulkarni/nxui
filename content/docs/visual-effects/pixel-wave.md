---
title: Pixel Wave
description: A looping pixel-art scene rendered on a dark LED grid of colored patches, with four swappable presets.
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

A fixed 20×19 grid of square cells renders a looping pixel-art scene. The
grid never moves — the animation is pure cell-state: colored bands turn on
and off as procedural fields morph through a crest, trough, near-black fade
window, and a rebuild before the loop restarts. Empty cells keep a faint LED
outline, so the display reads as a pixel patch panel even when the scene is
gone.

Four `scene` presets ship built in, each with its own palette and motion:

- **`tahiti`** — a rolling ocean swell of foam, turquoise, teal and navy.
- **`desert`** — sky bands over a pulsing sun disc and undulating dunes.
- **`hearth`** — an inverted-triangle flame from white core to crimson tips.
- **`mind`** — two sparse threads that drift, briefly meet, then separate.

The canvas sizes itself to its container (cells scale to fit), honors
`prefers-reduced-motion` by freezing on a static frame, and reports the
current phase through the `phase` event so you can drive captions or
accessibility status text.

## Props

| Prop               | Type             | Default    | Description                                          |
| ------------------ | ---------------- | ---------- | ---------------------------------------------------- |
| `scene`            | `PixelWaveScene` | `'tahiti'` | Scene preset: `tahiti`, `desert`, `hearth` or `mind` |
| `speed`            | `number`         | `1`        | Animation speed multiplier                           |
| `vertical-padding` | `number`         | `0`        | Extra empty rows above and below the grid            |
| `animate`          | `boolean`        | `true`     | Run the looping animation                            |

## Events

| Event   | Payload          | Description                                                                   |
| ------- | ---------------- | ----------------------------------------------------------------------------- |
| `phase` | `PixelWavePhase` | Fired when the loop enters a new phase (`crest`, `trough`, `fade`, `rebuild`) |

## Credits

Inspired by a series of pixel-patch scene experiments shared in the Vue
community.
