---
title: Grain Gradient
description: A breathing color field with a soft curved shadow, flowing light and fine film grain, drawn with WebGL.
---

A softly curved color field with fine film grain. The light and the shadow edge breathe slowly together. Use the control panel to change the palette, the composition, the grain and the speed.

::demo-grain-gradient
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/grain-gradient.json"
```

## Usage

```vue
<script setup lang="ts">
  import GrainGradient from '~/components/ui/grain-gradient/GrainGradient.vue';
</script>

<template>
  <section class="relative h-140 overflow-hidden rounded-2xl">
    <GrainGradient
      class="absolute inset-0"
      color-light="#dce5df"
      color-mid="#83b9ad"
      color-dark="#031419"
      :grain="0.32"
      :speed="1"
    />
    <div class="relative z-10">
      <!-- hero content -->
    </div>
  </section>
</template>
```

Give the component or its parent a height. Colors accept three- or six-digit hex values and stay the same in light and dark mode. Without WebGL, a CSS gradient of the same three colors shows instead. Motion pauses offscreen and in hidden tabs. Set `speed` to `0` to stop on the current frame.

## Props

| Prop          | Type     | Default     | Description                                                          |
| ------------- | -------- | ----------- | -------------------------------------------------------------------- |
| `color-light` | `string` | `'#dce5df'` | Pale highlight color (hex).                                          |
| `color-mid`   | `string` | `'#83b9ad'` | Upper-left wash and diffused edge color (hex).                       |
| `color-dark`  | `string` | `'#031419'` | Deep shadow color (hex).                                             |
| `angle`       | `number` | `0`         | Composition rotation in degrees, -360 to 360.                        |
| `position`    | `number` | `0`         | Horizontal edge offset, -1 to 1.                                     |
| `curve`       | `number` | `0.48`      | Shadow edge curvature, -1 to 1.                                      |
| `softness`    | `number` | `0.13`      | Edge diffusion width, 0.01 to 1.                                     |
| `scale`       | `number` | `1`         | Composition zoom, 0.25 to 3.                                         |
| `grain`       | `number` | `0.32`      | Film grain strength, 0 to 1. Zero removes the texture.               |
| `grain-size`  | `number` | `1`         | Grain size in CSS pixels, 0.5 to 4.                                  |
| `seed`        | `number` | `1`         | Reproducible texture seed, 0 to 100000.                              |
| `speed`       | `number` | `1`         | Breathing speed, 0 to 2. At 1 the main cycle lasts about 12 seconds. |
| `class`       | `string` | `''`        | Extra classes for the container (sizing, rounding).                  |

## Accessibility

- The surface is decorative. It sets `aria-hidden="true"` and ignores pointer events, so put any content in a separate layer.
- With `prefers-reduced-motion: reduce`, the gradient draws one still frame and does not animate.

- Ported from [componentry.fun](https://componentry.dev/docs/components/grain-gradient) by Harsh Jadhav.
