---
title: Prism Gradient
description: WebGL2 hero gradient — three colors swirled through sixteen iterations of sinusoidal distortion, tracking light and dark mode automatically.
---

::demo-prism-gradient
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/prism-gradient.json"
```

## Usage

```vue
<script setup lang="ts">
  import PrismGradient from '~/components/ui/prism-gradient/PrismGradient.vue';
</script>

<template>
  <section class="relative min-h-screen">
    <PrismGradient :speed="1" :noise="{ opacity: 0.5 }" />
    <div class="relative z-10">
      <!-- hero content -->
    </div>
  </section>
</template>
```

The component absolutely fills its nearest positioned ancestor and renders
behind your content (`z-0`). Palettes are fixed to the upstream design —
near-black/blue/white in dark mode, inverted in light mode — and switch
automatically with the site color mode. Falls back to a static radial
gradient without WebGL2 and freezes when `prefers-reduced-motion` is set.

## Props

| Prop     | Type                                  | Default | Description                            |
| -------- | ------------------------------------- | ------- | -------------------------------------- |
| `speed`  | `number`                              | `1`     | Animation speed multiplier (0 = still) |
| `noise`  | `{ opacity: number; scale?: number }` | —       | Optional grain overlay                 |
| `radius` | `string`                              | `'0px'` | Border radius of the gradient          |
| `class`  | `string`                              | `''`    | Extra classes on the wrapper           |

## Credits

- Ported from [componentry.fun](https://www.componentry.dev/docs/components/prism-gradient)
