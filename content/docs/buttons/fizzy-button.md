---
title: Fizzy Button
description: A button that starts to fizz as your pointer approaches, then floods with rising particles and inverts on hover.
---

::demo-fizzy-button
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fizzy-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import FizzyButton from '~/components/ui/fizzy-button/FizzyButton.vue';
</script>

<template>
  <FizzyButton label="Make it happen" :proximity="160" />
</template>
```

Particles fade in once the pointer is within `proximity` pixels of the button, and the animation only runs while the pointer is within `proximity + wake-margin`. Hovering, pressing or keyboard-focusing the button raises an inverting fill, and the particles at its edge swell as it passes. With `trigger="toggle"`, a click locks the fill and `v-model:pressed` holds the state.

## Props

| Prop              | Type                                                       | Default            | Description                                 |
| ----------------- | ---------------------------------------------------------- | ------------------ | ------------------------------------------- |
| `label`           | `string`                                                   | `'Make it happen'` | Button text; the default slot overrides it  |
| `trigger`         | `'hover' \| 'toggle'`                                      | `'hover'`          | Fill on hover, or toggle on click           |
| `proximity`       | `number`                                                   | `160`              | Px beyond the button where particles appear |
| `wake-margin`     | `number`                                                   | `60`               | Extra px where the animation starts running |
| `shape`           | `'mixed' \| 'circle' \| 'square' \| 'triangle' \| 'cross'` | `'mixed'`          | Particle shape                              |
| `count`           | `number`                                                   | `80`               | Number of particles                         |
| `size`            | `number`                                                   | `1.5`              | Particle size                               |
| `variation`       | `number`                                                   | `0.65`             | Size spread between particles               |
| `drift`           | `number`                                                   | `1`                | Sideways sway                               |
| `spin`            | `number`                                                   | `1`                | Rotation speed                              |
| `crest`           | `number`                                                   | `1`                | Size and opacity boost at the fill edge     |
| `rest-alpha`      | `number`                                                   | `0.18`             | Particle opacity at rest                    |
| `active-alpha`    | `number`                                                   | `0.58`             | Particle opacity when filled                |
| `idle-speed`      | `number`                                                   | `0.35`             | Rise speed at rest                          |
| `active-speed`    | `number`                                                   | `1.5`              | Rise speed when filled                      |
| `fill-duration`   | `number`                                                   | `0.7`              | Seconds for the fill to rise or fall        |
| `debug`           | `boolean`                                                  | `false`            | Shows the proximity and wake rings          |
| `v-model:pressed` | `boolean`                                                  | `false`            | Toggle state when `trigger` is `toggle`     |

The animation pauses off screen and in background tabs. With `prefers-reduced-motion`, particles stay still and the fill switches instantly.

Ported from Jhey Tompkins' [fizzy button](https://jhey.dev/demos/2026/fizzy-button).
