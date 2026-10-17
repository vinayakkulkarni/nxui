---
title: Metallic Paint
description: Liquid chrome that flows over your logo or text, with reflections that bend around the edges, tilt with the cursor and pour in on load.
---

Liquid chrome that flows over a logo or a line of text. The shape's interior is solved into a soft depth field, so the reflections bend around its edges like poured metal. The metal pours in from the outline on load; move the cursor over it to tilt the reflections.

::demo-metallic-paint
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/metallic-paint.json"
```

## Usage

```vue
<script setup lang="ts">
  import MetallicPaint from '~/components/ui/metallic-paint/MetallicPaint.vue';
</script>

<template>
  <div class="relative h-125 w-full">
    <!-- A logo (SVGs work best; transparent pixels stay empty) -->
    <MetallicPaint image-src="/logo.svg" :edge-bend="0.6" :mouse-tilt="0.5" />
  </div>

  <div class="relative h-80 w-full">
    <!-- Or text -->
    <MetallicPaint
      text="Gold"
      color="#f2c46b"
      :dispersion="0.15"
      :scale="0.7"
    />
  </div>
</template>
```

Opaque images (for example a black logo on a white JPG) are keyed automatically: dark pixels become the shape and light pixels are dropped. Use `light-mode` on light pages so the brightest highlights get a soft dark rim.

## Props

| Prop               | Type      | Default                   | Description                                                                               |
| ------------------ | --------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `image-src`        | `string`  | —                         | URL of the logo or image to paint. SVGs work best. Transparent pixels are left empty.     |
| `text`             | `string`  | —                         | Text to paint instead of an image. Takes priority over `image-src`.                       |
| `font-family`      | `string`  | `'system-ui, sans-serif'` | Font used for text.                                                                       |
| `font-weight`      | `number`  | `800`                     | Font weight used for text.                                                                |
| `color`            | `string`  | `'#ffffff'`               | Tint of the metal. White keeps it chrome, warm tones turn it gold or copper.              |
| `background-color` | `string`  | `'transparent'`           | Color behind the shape. The canvas is transparent by default.                             |
| `density`          | `number`  | `2`                       | How many reflection bands run across the shape.                                           |
| `softness`         | `number`  | `0.1`                     | Softness of the reflection edges, from 0 for crisp chrome to 1 for brushed metal.         |
| `dispersion`       | `number`  | `0.3`                     | Rainbow fringes where the reflections bend, from 0 to 1.                                  |
| `distortion`       | `number`  | `0.07`                    | How much the reflections ripple as they flow, from 0 to 1.                                |
| `edge-bend`        | `number`  | `0.6`                     | How strongly the reflections bend around the edges of the shape, from 0 to 1.             |
| `angle`            | `number`  | `70`                      | Direction the reflections flow in, in degrees.                                            |
| `speed`            | `number`  | `1`                       | Speed of the flow. `0` freezes it.                                                        |
| `scale`            | `number`  | `0.6`                     | Size of the shape inside the canvas.                                                      |
| `rotation`         | `number`  | `0`                       | Rotation of the shape, in degrees.                                                        |
| `mouse-tilt`       | `number`  | `0.5`                     | How much the reflections shift as the cursor moves, as if tilting the metal.              |
| `light-mode`       | `boolean` | `false`                   | Adds a soft dark rim and dims the brightest highlights so the shape reads on light pages. |
| `intro`            | `boolean` | `true`                    | Pours the metal in from the outline on mount.                                             |
| `paused`           | `boolean` | `false`                   | Freezes the animation.                                                                    |
| `dpr`              | `number`  | auto                      | Device pixel ratio cap. Renders at 2× or more for clean edges.                            |
| `class`            | `string`  | `''`                      | Extra classes for the container.                                                          |

## Accessibility

- The canvas is decorative. Put the real logo text or brand name in the page as well (for example in a visually hidden heading).
- With `prefers-reduced-motion: reduce`, the flow and the pour-in intro are skipped; a still frame is drawn and the cursor tilt still works.
- Rendering sleeps when the component is off-screen, and when `speed` is `0` or `paused` is set and the tilt has settled.

- Ported from [React Bits](https://reactbits.dev/animations/metallic-paint) by David Haz.
