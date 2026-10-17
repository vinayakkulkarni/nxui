---
title: Fluid Glass
description: A ray-marched glass object that bends your own headline, image or video, follows the cursor and melts between seven shapes.
---

A real glass object drawn over your content with raw WebGL2: the headline, image or video behind it is refracted, split into rainbow fringes and frosted, and the glass casts a shadow with focused light below it. Move the cursor and it glides after you, stretching like a liquid. Click it to melt it into the next shape. In `drag` mode you can pick it up and throw it against the edges.

::demo-fluid-glass
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fluid-glass.json"
```

## Usage

```vue
<script setup lang="ts">
  import FluidGlass from '~/components/ui/fluid-glass/FluidGlass.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <FluidGlass
      text="Look closer."
      shape="torus"
      interaction="follow"
      :size="260"
      :refraction="1"
      :dispersion="0.35"
      @shape-change="(shape) => console.log(shape)"
    />
  </div>
</template>
```

The glass sizes itself from its container, so give the parent a real height. It has no 3D models and no dependencies beyond `@vueuse/core`. Shader programs compile in the background (with `KHR_parallel_shader_compile` where available), and while the glass is at rest the loop draws fewer frames on high refresh rate screens.

## Props

| Prop                     | Type                                                                      | Default          | Description                                                                                           |
| ------------------------ | ------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `text`                   | `string`                                                                  | `'Look closer.'` | Headline drawn behind the glass so the glass can bend it. Use `\n` for line breaks.                   |
| `src`                    | `string`                                                                  | —                | Image or video behind the glass. Videos (.mp4, .webm, .mov) play muted on a loop. Needs CORS headers. |
| `fit`                    | `'cover' \| 'contain'`                                                    | `'cover'`        | How the image or video fills the area.                                                                |
| `background`             | `string`                                                                  | `'transparent'`  | Colour behind the text and media. Transparent lets the page show through.                             |
| `text-color`             | `string`                                                                  | inherited        | Colour of the text. Defaults to the CSS `color` of the container.                                     |
| `font-family`            | `string`                                                                  | inherited        | Font of the text. Defaults to the font of the container.                                              |
| `font-weight`            | `number \| string`                                                        | `600`            | Weight of the text.                                                                                   |
| `font-size`              | `number`                                                                  | auto             | Size of the text in px. By default it scales to fill the width.                                       |
| `shape`                  | `'torus' \| 'lens' \| 'blob' \| 'pill' \| 'cube' \| 'prism' \| 'diamond'` | `'torus'`        | Shape of the glass. Changing it melts the glass into the new shape. The blob keeps rippling.          |
| `shapes`                 | `FluidGlassShape[]`                                                       | all shapes       | Shapes the glass cycles through when clicked.                                                         |
| `morph-on-click`         | `boolean`                                                                 | `true`           | Clicking the glass melts it into the next shape.                                                      |
| `size`                   | `number`                                                                  | `260`            | Diameter of the glass in px. It shrinks to fit small areas.                                           |
| `interaction`            | `'follow' \| 'drag' \| 'static'`                                          | `'follow'`       | Glide after the cursor, pick up and throw, or stay in place.                                          |
| `position`               | `[number, number]`                                                        | `[0.5, 0.5]`     | Where the glass rests, as fractions of the width and height.                                          |
| `refraction`             | `number`                                                                  | `1`              | How strongly the glass bends light, 0 to 2. Around 0.66 behaves like water.                           |
| `dispersion`             | `number`                                                                  | `0.35`           | How much light splits into rainbow fringes at the edges, 0 to 1.                                      |
| `frost`                  | `number`                                                                  | `0`              | Frosts the glass so what is behind it blurs, 0 to 1.                                                  |
| `color`                  | `string`                                                                  | `'#ffffff'`      | Colour of the glass.                                                                                  |
| `tint`                   | `number`                                                                  | `0`              | How strongly the glass takes on its colour. Thicker parts look deeper.                                |
| `reflection`             | `number`                                                                  | `1`              | Strength of the highlights and reflections, 0 to 2.                                                   |
| `shadow`                 | `number`                                                                  | `0.5`            | Strength of the shadow and focused light below the glass, 0 to 1.                                     |
| `elevation`              | `number`                                                                  | `0.4`            | How high the glass floats. Higher magnifies more, until the image flips.                              |
| `smoothness`             | `number`                                                                  | `0.5`            | How lazily the glass follows, 0 (snappy) to 1 (floaty).                                               |
| `wobble`                 | `number`                                                                  | `0.5`            | How much the glass stretches when it moves and wobbles when it stops. 0 keeps it rigid.               |
| `spin`                   | `number`                                                                  | `0.3`            | Idle rotation speed for shapes like the cube and torus. Negative values spin the other way.           |
| `idle`                   | `boolean`                                                                 | `true`           | Drift gently around the resting place while nobody interacts.                                         |
| `intro`                  | `boolean`                                                                 | `true`           | Pop into place on mount.                                                                              |
| `max-device-pixel-ratio` | `number`                                                                  | `2`              | Highest pixel ratio the canvas renders at.                                                            |
| `class`                  | `string`                                                                  | —                | Extra classes for the container.                                                                      |

## Events

| Event          | Payload                  | Description                                     |
| -------------- | ------------------------ | ----------------------------------------------- |
| `shape-change` | `shape: FluidGlassShape` | Fired when the glass starts melting to a shape. |

## Slots

| Slot      | Description                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| `default` | Content layered on top, such as buttons. It sits above the glass and is not bent by it. |

## Accessibility

- The canvas is `aria-hidden`; the headline is also rendered as visually hidden text so screen readers read it.
- With `prefers-reduced-motion: reduce` the glass does not drift, spin, tilt or stretch, morphs are shorter and the intro pop is skipped.
- Rendering pauses when the glass is offscreen or the tab is hidden, and video playback pauses with it.

- Ported from [React Bits](https://reactbits.dev/components/fluid-glass) by David Haz.
