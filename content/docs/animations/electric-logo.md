---
title: Electric Logo
description: Turns any logo into a living lightning outline, with arcs that leap off its edges.
---

Traces any logo or image into a living lightning outline. Strands follow the shape's edge and sway, ripple and crackle as they flow, and short arcs leap off the edge. Hover to charge the lightning around the cursor; click to send a ripple through it with a burst of arcs. Use the pane to switch logos or upload your own.

::demo-electric-logo
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/electric-logo.json"
```

## Usage

```vue
<script setup lang="ts">
  import ElectricLogo from '~/components/ui/electric-logo/ElectricLogo.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <ElectricLogo
      src="/logo.svg"
      color="#ecc7ff"
      glow-color="#ad6dff"
      :scale="0.7"
      :strands="4"
      :bend="0.6"
      :crackle="1.5"
      :arcs="1"
      :speed="2.5"
      theme="dark"
    />
  </div>
</template>
```

Pass any image URL as `src`. SVGs and transparent PNGs are traced by their alpha; opaque images are traced by keying out their backdrop colour. Remote images must allow CORS. Changing `src` morphs the lightning from the old shape to the new one. Set `theme="light"` when the logo sits on a light background.

## Props

| Prop               | Type                                  | Default          | Description                                                                                                                                              |
| ------------------ | ------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`              | `string`                              | `lightning bolt` | Any image URL. SVGs and transparent PNGs are traced by their alpha; opaque images by keying out their backdrop colour.                                   |
| `color`            | `string`                              | `'#ecc7ff'`      | Colour of the hot core of every strand.                                                                                                                  |
| `glow-color`       | `string`                              | `'#ad6dff'`      | Colour of the glow around the strands, the bloom and the interior fill.                                                                                  |
| `scale`            | `number`                              | `0.7`            | Size of the logo as a fraction of the container. The glow and arcs extend beyond it.                                                                     |
| `intensity`        | `number`                              | `1`              | Overall brightness of the effect.                                                                                                                        |
| `glow`             | `number`                              | `1`              | Strength of the halo around strands and the soft bloom around the shape.                                                                                 |
| `thickness`        | `number`                              | `1.5`            | Width of the main strand, in px. Satellite strands are thinner, and every strand swells and thins as it flows.                                           |
| `strands`          | `number`                              | `4`              | Number of filaments tracing the outline, from 1 to 6. Extra strands come and go along the edge.                                                          |
| `bend`             | `number`                              | `0.6`            | How far the strands sway and ripple away from the outline. The main strand stays closest.                                                                |
| `crackle`          | `number`                              | `1.5`            | Size of the fine crinkle along every strand and arc.                                                                                                     |
| `arcs`             | `number`                              | `1`              | How often short arcs leap off the edge and land further along it. `0` turns them off.                                                                    |
| `flicker`          | `number`                              | `0.6`            | How much the whole effect pulses and each strand shimmers in brightness.                                                                                 |
| `fill`             | `number`                              | `0`              | Translucent glow inside the shape, brightest near its edges.                                                                                             |
| `speed`            | `number`                              | `2.5`            | Animation speed. `0` freezes the current frame.                                                                                                          |
| `interactive`      | `boolean`                             | `true`           | Turn on pointer interactions. Hovering charges the lightning around the cursor, and a click sends a ripple through it with a burst of arcs.              |
| `cursor-intensity` | `number`                              | `0.75`           | How strongly the lightning charges up around the cursor. `0` turns the hover charge off.                                                                 |
| `cursor-radius`    | `number`                              | `100`            | Radius of the charged area around the cursor, in px.                                                                                                     |
| `theme`            | `'dark' \| 'light'`                   | `'dark'`         | The background the logo sits on. Dark renders the lightning as emitted light. Light renders crisp electric ink with a white-hot core and a lighter fill. |
| `on-render`        | `(canvas: HTMLCanvasElement) => void` | `undefined`      | Called immediately after each rendered frame. Copy the canvas synchronously to capture the current frame for effects such as live reflections.           |
| `class`            | `string`                              | `''`             | Extra classes on the container. The container fills its parent, so give the parent a size.                                                               |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Add a visible caption or an `aria-label` on a parent if the logo carries meaning.
- With `prefers-reduced-motion: reduce` the animation runs at 20% speed, flicker and ambient arcs are off, and clicks do not send ripples.
- The render loop stops while the component is offscreen, and the WebGL context is released on unmount.
- Needs WebGL 2. Without it the component renders an empty container.

- Ported from [React Bits](https://reactbits.dev/animations/electric-logo) by David Haz.
