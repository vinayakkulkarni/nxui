---
title: Spectral Ribbon
description: A soft spectral light ribbon on pure black — slow liquid motion and a rainbow fringe, drawn by a single WebGL fragment shader.
---

A glowing C-shaped light trail arcs across a black canvas. Its core runs hot cream, its edges split into a prismatic warm → green → cyan → blue → magenta fringe, and a soft noise warp keeps it drifting like liquid. It is a pure background: put hero content in the default slot.

::demo-spectral-ribbon
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/spectral-ribbon.json"
```

## Usage

```vue
<script setup lang="ts">
  import SpectralRibbon from '~/components/ui/spectral-ribbon/SpectralRibbon.vue';
</script>

<template>
  <SpectralRibbon class="h-140 rounded-2xl" :speed="1" :intensity="1">
    <div class="flex size-full items-end p-10">
      <h1 class="text-5xl font-semibold text-white">Ship in light.</h1>
    </div>
  </SpectralRibbon>
</template>
```

Give the root an explicit height — the canvas fills its container and the ribbon reframes itself on square and portrait aspect ratios so the full arc stays visible.

## Props

| Prop        | Type     | Default | Description                                      |
| ----------- | -------- | ------- | ------------------------------------------------ |
| `speed`     | `number` | `1`     | Animation speed, 0 to 2. Zero freezes the frame. |
| `intensity` | `number` | `1`     | Ribbon brightness, 0.25 to 2.                    |
| `thickness` | `number` | `1`     | Ribbon thickness, 0.5 to 2.                      |
| `grain`     | `number` | `0.45`  | Film grain amount, 0 to 1.                       |
| `class`     | `string` | `''`    | Additional classes for the root container.       |

## Slots

| Slot      | Description                                        |
| --------- | -------------------------------------------------- |
| `default` | Content composed over the ribbon (`z-10`, filled). |

## Accessibility

- The canvas is decorative (`aria-hidden="true"`, `pointer-events-none`); slot content stays fully interactive.
- With `prefers-reduced-motion: reduce` the ribbon renders one still frame and stops.
- The render loop pauses when the canvas is offscreen or the tab is hidden, and the WebGL context is released on unmount.

- Ported from [componentry.fun](https://componentry.dev/docs/components/spectral-ribbon) by Harsh Jadhav.
