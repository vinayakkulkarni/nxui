---
title: Chaos Button
description: A pill button filled with drifting neon lines from a WebGL shader that tighten and scatter while pressed.
---

::demo-chaos-button
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/chaos-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import ChaosButton from '~/components/ui/chaos-button/ChaosButton.vue';
</script>

<template>
  <ChaosButton label="Chaos Button" />
</template>
```

At rest, soft neon lines drift across the button. Pressing it with the pointer, Enter or Space eases every shader value into the active state — faster, tighter and more chaotic — and releasing eases back.

## Props

| Prop               | Type                  | Default          | Description                                |
| ------------------ | --------------------- | ---------------- | ------------------------------------------ |
| `label`            | `string`              | `'Chaos Button'` | Button text; the default slot overrides it |
| `noise`            | `'hash' \| 'trig'`    | `'trig'`         | Noise function behind the lines            |
| `resting`          | `Partial<ChaosState>` | `{}`             | Overrides for the resting state            |
| `active`           | `Partial<ChaosState>` | `{}`             | Overrides for the pressed state            |
| `active-duration`  | `number`              | `0.5`            | Seconds to ease into the pressed state     |
| `resting-duration` | `number`              | `0.5`            | Seconds to ease back to rest               |

`ChaosState` is `{ speed, amplitude, pulseMin, pulseMax, chaos }`. The defaults are `{ 0.35, 80, 0.05, 0.2, 1 }` at rest and `{ 0.8, 10, 0.05, 0.2, 2.6 }` when pressed.

The shader pauses off screen. With `prefers-reduced-motion`, the lines hold still and state changes are instant.

Ported from Jhey Tompkins' [GLSL chaos button](https://jhey.dev/demos/2026/glsl-chaos-button).
