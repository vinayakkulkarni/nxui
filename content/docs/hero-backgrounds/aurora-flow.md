---
title: Aurora Flow
description: Procedural WebGL hero background with layered silk flow, diffused aurora light, film grain and a soft pointer bend, with twelve palette presets.
---

A single full-screen WebGL quad renders warped fbm fields into silk folds, a traveling bloom and an ambient lift. Move the pointer over it to bend the flow toward the cursor; turn on `scroll-interaction` to add page-scroll parallax.

::demo-aurora-flow
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/aurora-flow.json"
```

## Usage

```vue
<script setup lang="ts">
  import AuroraFlow from '~/components/ui/aurora-flow/AuroraFlow.vue';
</script>

<template>
  <AuroraFlow preset="ocean" class="min-h-150">
    <div class="flex size-full items-center justify-center">
      <h1 class="text-5xl font-semibold text-white">Vue ✦ nxui</h1>
    </div>
  </AuroraFlow>
</template>
```

Colors you pass in `colors` replace the preset colors by position (base, depth, flow, light, sheen). Invalid hex values fall back to the preset. The canvas caps pixel density at 1.75, pauses when it leaves the viewport or the tab is hidden, and draws one static frame when `prefers-reduced-motion` is set.

## Props

| Prop                  | Type                | Default   | Description                                                                                                       |
| --------------------- | ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| `colors`              | `readonly string[]` | —         | Up to five hex colors that override the preset.                                                                   |
| `preset`              | `AuroraFlowPreset`  | `'ocean'` | `ocean`, `aurora`, `sky`, `cloud`, `sunset`, `midnight`, `ice`, `dream`, `nebula`, `emerald`, `lavender`, `mono`. |
| `speed`               | `number`            | `1`       | Global motion speed (0–3).                                                                                        |
| `intensity`           | `number`            | `1`       | Strength of the flowing color and silk highlights (0–2).                                                          |
| `opacity`             | `number`            | `1`       | Final canvas opacity (0–1).                                                                                       |
| `blur`                | `number`            | `1`       | Diffusion softness of the atmospheric fields (0.25–2).                                                            |
| `contrast`            | `number`            | `1.04`    | Final color contrast (0.6–1.6).                                                                                   |
| `brightness`          | `number`            | `1`       | Final scene brightness (0.5–1.5).                                                                                 |
| `grain`               | `boolean`           | `true`    | Turns on fine film grain.                                                                                         |
| `grain-opacity`       | `number`            | `0.22`    | Grain strength (0–1).                                                                                             |
| `layers`              | `number`            | `6`       | fbm octaves, rounded and clamped to 3–7.                                                                          |
| `flow-scale`          | `number`            | `1`       | Scale of the broad structures (0.35–2.5).                                                                         |
| `flow-strength`       | `number`            | `1`       | Strength of the domain warp and silk folds (0–2).                                                                 |
| `flow-direction`      | `number`            | `-18`     | Main flow direction in degrees.                                                                                   |
| `animation-speed`     | `number`            | `1`       | Fine multiplier for the procedural motion (0–3).                                                                  |
| `pointer-interaction` | `boolean`           | `true`    | Bends the flow toward the pointer.                                                                                |
| `pointer-strength`    | `number`            | `0.7`     | Maximum pointer influence (0–1.5).                                                                                |
| `scroll-interaction`  | `boolean`           | `false`   | Shifts the field as the page scrolls.                                                                             |
| `parallax-strength`   | `number`            | `0.5`     | Scroll parallax strength (0–1.5).                                                                                 |
| `lighting`            | `boolean`           | `true`    | Turns on the traveling bloom.                                                                                     |
| `lighting-intensity`  | `number`            | `0.8`     | Bloom brightness (0–2).                                                                                           |
| `lighting-radius`     | `number`            | `1`       | Bloom radius (0.3–2).                                                                                             |
| `lighting-speed`      | `number`            | `0.8`     | Bloom travel speed (0–2).                                                                                         |
| `ambient-glow`        | `boolean`           | `true`    | Turns on the central ambient lift.                                                                                |
| `ambient-opacity`     | `number`            | `0.7`     | Ambient lift strength (0–1.5).                                                                                    |
| `noise`               | `boolean`           | `true`    | Turns on low-frequency haze.                                                                                      |
| `noise-opacity`       | `number`            | `0.16`    | Haze strength (0–1).                                                                                              |
| `noise-scale`         | `number`            | `1`       | Haze scale (0.4–3).                                                                                               |
| `vignette`            | `boolean`           | `true`    | Turns on the soft edge falloff.                                                                                   |
| `vignette-strength`   | `number`            | `0.55`    | Edge falloff strength (0–1.5).                                                                                    |
| `border-radius`       | `string \| number`  | `0`       | Radius of the container. Numbers are pixels.                                                                      |
| `class`               | `string`            | —         | Extra classes for the root. The root has `min-h-105` by default.                                                  |

## Slots

| Slot      | Description                                |
| --------- | ------------------------------------------ |
| `default` | Content drawn above the canvas, full size. |

## Accessibility

- The canvas and its static fallback are `aria-hidden`; put real content in the default slot.
- With `prefers-reduced-motion: reduce` the animation, pointer bend and scroll parallax stop, and one static frame is drawn.
- Without WebGL, a static radial gradient built from the same palette is shown.

- Ported from [componentry.fun](https://componentry.dev/docs/components/aurora-flow) by Harsh Jadhav.
