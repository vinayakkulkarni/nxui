---
title: Light Tunnel
description: A swirling fibre-optic tunnel where comets of light race into depth, steered by the cursor.
---

A WebGL2 tunnel of fine glowing fibres with comet-like pulses racing along them. Move the cursor to steer the far end of the tunnel, and click to send a ring of light down it. In light mode the tunnel is drawn as ink.

::demo-light-tunnel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/light-tunnel.json"
```

## Usage

```vue
<script setup lang="ts">
  import LightTunnel from '~/components/ui/light-tunnel/LightTunnel.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <LightTunnel
      pulse-color="#ffb070"
      cable-color="#ffd2a8"
      flow-direction="inward"
      :pulse-density="0.5"
    />
  </div>
</template>
```

## Props

| Prop                | Type                    | Default            | Description                                                                       |
| ------------------- | ----------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `cable-color`       | `string`                | `'#ffffff'`        | Color of the fibres.                                                              |
| `pulse-color`       | `string`                | `'#ffffff'`        | Color of the light pulses.                                                        |
| `tunnel-color`      | `string`                | `'#ffffff'`        | Color of the soft glow around the fibres, shown when `tunnel-opacity` is above 0. |
| `tunnel-opacity`    | `number`                | `0`                | Strength of the soft glow around the fibres that tints the tunnel walls.          |
| `speed`             | `number`                | `0.1`              | Overall speed of the tunnel.                                                      |
| `flow-direction`    | `'inward' \| 'outward'` | `'inward'`         | Whether the pulses race into the tunnel or rush out toward you.                   |
| `pulse-speed`       | `number`                | `2`                | How fast the pulses travel.                                                       |
| `pulse-length`      | `number`                | `0.28`             | Length of each pulse and its tail.                                                |
| `pulse-blend`       | `number`                | `0.6`              | Softness of the pulses, from crisp sparks (0) to long soft streaks (1).           |
| `pulse-width`       | `number`                | `1`                | Width of the pulses relative to the fibres.                                       |
| `pulse-density`     | `number`                | `0.5`              | How many pulses are travelling at once, from 0 to 1.                              |
| `cable-count`       | `number`                | `56`               | Number of fibres around the tunnel.                                               |
| `thickness`         | `number`                | `0.35`             | Thickness of the fibres.                                                          |
| `rim-width`         | `number`                | `0.15`             | How far the glow spreads around each pulse.                                       |
| `waviness`          | `number`                | `0.3`              | How much the fibres swirl along the tunnel.                                       |
| `sway`              | `number`                | `0.5`              | How much the tunnel slowly rocks back and forth.                                  |
| `bend`              | `number`                | `0.4`              | How much the far end of the tunnel drifts and curves.                             |
| `size`              | `number`                | `1`                | Scale of the tunnel.                                                              |
| `center-x`          | `number`                | `0`                | Horizontal offset of the tunnel center.                                           |
| `center-y`          | `number`                | `0`                | Vertical offset of the tunnel center.                                             |
| `glow`              | `number`                | `1`                | Strength of the glow around the pulses.                                           |
| `fade-near`         | `number`                | `0.5`              | How far from the center the tunnel fades in. Higher values keep the middle clear. |
| `fade-far`          | `number`                | `2`                | Distance at which the tunnel fades out at the edges.                              |
| `brightness`        | `number`                | `1`                | Overall brightness.                                                               |
| `color-variance`    | `boolean`               | `true`             | Gives every fibre a slightly different brightness.                                |
| `grain`             | `boolean`               | `false`            | Adds a fine film grain to the light.                                              |
| `grain-intensity`   | `number`                | `0.05`             | Strength of the grain.                                                            |
| `opacity`           | `number`                | `1`                | Opacity of the whole effect.                                                      |
| `mouse-interaction` | `boolean`               | `true`             | Steers the far end of the tunnel toward the cursor.                               |
| `mouse-strength`    | `number`                | `0.1`              | How far the cursor steers the tunnel.                                             |
| `click-surge`       | `boolean`               | `true`             | Clicking sends a ring of light down the tunnel.                                   |
| `intro`             | `boolean`               | `true`             | Grows the tunnel out from the center on mount.                                    |
| `variation`         | `number`                | `0`                | Picks a different arrangement of fibres and pulses.                               |
| `light-mode`        | `boolean`               | `false`            | Draws the tunnel as ink for light backgrounds.                                    |
| `dpr`               | `number`                | `devicePixelRatio` | Maximum device pixel ratio, capped at 2.                                          |
| `class`             | `string`                | `''`               | Additional CSS classes for the container.                                         |

## Accessibility

The canvas is decorative and hidden from assistive technology (`aria-hidden`). With `prefers-reduced-motion: reduce` the tunnel holds still, the intro is skipped, and the cursor steer and click surge are disabled. The render loop pauses when the tunnel is offscreen or the tab is hidden, and sleeps when nothing moves.

- Ported from [React Bits](https://reactbits.dev/backgrounds/light-tunnel) by David Haz.
