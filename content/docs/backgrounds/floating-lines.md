---
title: Floating Lines
description: Ribbons of fine glowing lines that drift in waves, part around the cursor and curl when clicked.
---

Three waves of fine, glowing lines drift across the canvas. Move the cursor over them and the lines part around it while the waves shift in depth; click and the lines curl into a swirl that slowly unwinds in the direction the cursor was moving. On mount the waves swell in from flat lines. Raw WebGL2, no 3D library.

::demo-floating-lines
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/floating-lines.json"
```

## Usage

```vue
<script setup lang="ts">
  import FloatingLines from '~/components/ui/floating-lines/FloatingLines.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-black">
    <FloatingLines
      :lines-gradient="['#7fb2ff', '#ffffff']"
      line-style="dashed"
      :glow="0.6"
      :enabled-waves="['middle', 'bottom']"
    />
  </div>
</template>
```

The canvas is transparent and blends with `mix-blend-mode: screen`, so it sits on any dark page. Set `background-color` for an opaque backdrop, and `light-mode` on light pages: the lines print as ink instead of light. `floatingLinesPreset('signature' | 'classic' | 'mono' | 'lagoon' | 'ember' | 'dotted' | 'blueprint' | 'calm')` returns a ready-made look you can spread onto the component with `v-bind`.

## Props

| Prop                   | Type                                          | Default                           | Description                                                                                 |
| ---------------------- | --------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| `lines-gradient`       | `string[]`                                    | `['#e945f5', '#ffffff']`          | Up to 8 colors blended across the lines of each wave.                                       |
| `enabled-waves`        | `Array<'top' \| 'middle' \| 'bottom'>`        | `['top', 'middle', 'bottom']`     | Which waves to show.                                                                        |
| `line-count`           | `number \| number[]`                          | `10`                              | Lines per wave, from 1 to 24. Pass an array to set each enabled wave separately.            |
| `line-distance`        | `number \| number[]`                          | `6`                               | Spacing between the lines of a wave. Pass an array to set each enabled wave separately.     |
| `line-style`           | `'solid' \| 'dotted' \| 'dashed'`             | `'solid'`                         | Draws the lines as solid strands, rows of dots or dashes.                                   |
| `line-width`           | `number`                                      | `1`                               | Width of each line in pixels.                                                               |
| `glow`                 | `number`                                      | `1`                               | Strength of the glow around the lines.                                                      |
| `brightness`           | `number`                                      | `1`                               | Overall brightness of the lines.                                                            |
| `animation-speed`      | `number`                                      | `1`                               | Speed of the wave motion.                                                                   |
| `amplitude`            | `number`                                      | `1`                               | Height of the waves.                                                                        |
| `depth-of-field`       | `number`                                      | `0.5`                             | How much the waves in the back soften out of focus, from 0 to 1.                            |
| `edge-fade`            | `number`                                      | `0`                               | Fades the lines out toward the left and right edges, from 0 to 1.                           |
| `top-wave-position`    | `{ x?: number; y?: number; rotate?: number }` | `{ x: 10, y: 0.5, rotate: -0.4 }` | Offset, height and curl of the top wave.                                                    |
| `middle-wave-position` | `{ x?: number; y?: number; rotate?: number }` | `{ x: 5, y: 0, rotate: 0.2 }`     | Offset, height and curl of the middle wave.                                                 |
| `bottom-wave-position` | `{ x?: number; y?: number; rotate?: number }` | `{ x: 2, y: -0.7, rotate: -1 }`   | Offset, height and curl of the bottom wave.                                                 |
| `interactive`          | `boolean`                                     | `true`                            | Bends the lines around the cursor.                                                          |
| `bend-radius`          | `number`                                      | `5`                               | Size of the area around the cursor that bends the lines.                                    |
| `bend-strength`        | `number`                                      | `-0.5`                            | Negative values part the lines around the cursor, positive values pull them in.             |
| `mouse-damping`        | `number`                                      | `0.05`                            | How smoothly the bend follows the cursor, from 0 (frozen) to 1 (instant).                   |
| `parallax`             | `boolean`                                     | `true`                            | Shifts the waves in depth as the cursor moves.                                              |
| `parallax-strength`    | `number`                                      | `0.2`                             | Strength of the parallax shift.                                                             |
| `click-swirl`          | `boolean`                                     | `true`                            | Clicking stirs the lines into a curl that slowly unwinds, turning the way the cursor moved. |
| `intro`                | `boolean`                                     | `true`                            | Swells the waves in from flat lines on mount.                                               |
| `mix-blend-mode`       | `CSSProperties['mixBlendMode']`               | `'screen'`                        | CSS mix-blend-mode of the container in dark mode.                                           |
| `background-color`     | `string`                                      | `undefined`                       | Paints an opaque background behind the lines. Leave it unset for a transparent canvas.      |
| `light-mode`           | `boolean`                                     | `false`                           | Draws the lines as ink for light backgrounds.                                               |
| `opacity`              | `number`                                      | `1`                               | Opacity of the whole effect.                                                                |
| `dpr`                  | `number`                                      | auto                              | Maximum device pixel ratio, capped at 2.                                                    |
| `class`                | `string`                                      | `''`                              | Extra classes for the container.                                                            |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the waves hold still, the intro is skipped, and the cursor bend and click swirl are turned off.
- Rendering stops while the effect is off screen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/backgrounds/floating-lines) by David Haz.
