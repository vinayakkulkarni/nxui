---
title: Ripple Distortion
description: Pointer-driven water displacement that warps content and leaves a decaying wake.
---

Turns an image into a water surface. Move the pointer over it and each step drops a ringed ripple that swells, warps the photo and fades into a wake. Set `trigger` to `click` or `both` to drop stronger ripples on press.

::demo-ripple-distortion
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ripple-distortion.json"
```

## Usage

```vue
<script setup lang="ts">
  import RippleDistortion from '~/components/ui/ripple-distortion/RippleDistortion.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <RippleDistortion
      src="https://images.unsplash.com/photo-1782977389500-dd7adad33ebe"
      :brush-size="150"
      :strength="0.2"
      :swirl="1"
      :rings="4"
      :spread="5"
      trigger="hover"
    />
  </div>
</template>
```

The image is cover-fitted to the container and must be served with CORS headers.

## Props

| Prop              | Type                           | Default                             | Description                                                                        |
| ----------------- | ------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `src`             | `string`                       | `'https://images.unsplash.com/...'` | Image URL the ripples distort. Cover fitted to the container.                      |
| `brush-size`      | `number`                       | `150`                               | Diameter of each ripple the pointer lays down, in px.                              |
| `strength`        | `number`                       | `0.2`                               | How far the image is pushed, as a fraction of its size.                            |
| `swirl`           | `number`                       | `1`                                 | Full turns the push direction sweeps through as a ripple builds. 0 is a flat push. |
| `rings`           | `number`                       | `4`                                 | Concentric swells inside each ripple. 0 is a single plain blob.                    |
| `spread`          | `number`                       | `5`                                 | How many times its own size a ripple grows to before it dies.                      |
| `fade`            | `number`                       | `3`                                 | How long a ripple survives, in seconds.                                            |
| `spacing`         | `number`                       | `15`                                | Pointer travel between ripples, in px. Higher leaves a sparser trail.              |
| `dispersion`      | `number`                       | `0`                                 | Chromatic split between the red and blue channels as they refract.                 |
| `glint`           | `number`                       | `0`                                 | Sheen riding the shoulders of each ripple.                                         |
| `tint`            | `string`                       | `'#a855f7'`                         | Colour the disturbed water takes on.                                               |
| `tint-amount`     | `number`                       | `0.1`                               | How strongly the tint colours the disturbed water.                                 |
| `highlight-color` | `string`                       | `'#ffffff'`                         | Colour of the sheen.                                                               |
| `grayscale`       | `boolean`                      | `true`                              | Drain the colour out of the image so the folds read on tone alone.                 |
| `trigger`         | `'hover' \| 'click' \| 'both'` | `'hover'`                           | What disturbs the surface: motion, clicks, or both.                                |
| `click-strength`  | `number`                       | `2`                                 | How much larger a click ripple starts than a hover one.                            |
| `quality`         | `'low' \| 'medium' \| 'high'`  | `'low'`                             | Resolution of the displacement buffer. Lower trades crispness for fill rate.       |
| `enabled`         | `boolean`                      | `true`                              | Toggle the effect on or off.                                                       |
| `class`           | `string`                       | `''`                                | Extra classes for the root element.                                                |
| `style`           | `StyleValue`                   | `undefined`                         | Inline styles for the root element.                                                |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Add a visible caption or an `aria-label` on a parent if the image carries meaning.
- With `prefers-reduced-motion: reduce` the pointer lays down no ripples, so the image stays still.
- The render loop pauses while the canvas is offscreen or the tab is hidden. The WebGL context is released on unmount.
- Pointer tracking listens on the window, so ripples follow the pointer even over overlaid content.

- Ported from [React Bits](https://reactbits.dev/animations/ripple-distortion) by David Haz.
