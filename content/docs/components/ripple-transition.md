---
title: Ripple Transition
description: WebGL image transitions with noisy refractive waves, chromatic edges, glow, and click-triggered ripple origins.
---

::demo-ripple-transition
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ripple-transition.json"
```

## Usage

```vue
<script setup lang="ts">
  import RippleTransition from '~/components/ui/ripple-transition/RippleTransition.vue';
</script>

<template>
  <RippleTransition
    :images="['/photos/forest.jpg', '/photos/canyon.jpg', '/photos/river.jpg']"
    :duration="1.4"
    auto-play
    :auto-play-interval="3200"
    auto-play-origin="random"
    class="h-100"
  />
</template>
```

Clicking (or pressing Enter/Space) launches a ripple from that point: a
noise-warped wavefront expands outward, radially displacing the image with
chromatic aberration and a bloom highlight along the band, revealing the
next image behind it. With three or more images the component cycles
through them, rebinding the hidden texture slot after each swap.

## Props

| Prop                 | Type                   | Default        | Description                                 |
| -------------------- | ---------------------- | -------------- | ------------------------------------------- |
| `images`             | `string[]`             | 3 sample shots | Images to transition between (min. two)     |
| `duration`           | `number`               | `1.4`          | Transition duration in seconds              |
| `auto-play`          | `boolean`              | `false`        | Trigger transitions on an interval          |
| `auto-play-interval` | `number`               | `3200`         | Milliseconds between automatic transitions  |
| `auto-play-origin`   | `'center' \| 'random'` | `'center'`     | Start point for autoplay ripples            |
| `wave-speed`         | `number`               | `1.6`          | Speed of the expanding wavefront            |
| `sigma`              | `number`               | `0.15`         | Thickness of the main ripple band           |
| `wave-freq`          | `number`               | `5`            | Frequency of the small concentric ripples   |
| `push-amt`           | `number`               | `0.145`        | Amount of radial image displacement         |
| `ca-strength`        | `number`               | `0.02`         | Chromatic aberration strength               |
| `glow`               | `number`               | `0.73`         | Bloom-like highlight strength on the wave   |
| `noise-warp`         | `number`               | `1`            | Noise applied to the ripple edge            |
| `pinch`              | `boolean`              | `false`        | Subtle inward pull at the ripple origin     |
| `border-radius`      | `number`               | `24`           | Root border radius in pixels                |
| `background`         | `string`               | `'#111416'`    | Canvas fallback background                  |
| `label`              | `string`               | —              | Accessible label for the interactive region |

## Credits

Ported from [componentry.fun](https://componentry.dev/docs/components/ripple-transition)
by [@harshjdhv](https://x.com/harshjdhv).
