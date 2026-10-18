---
title: Color Bends
description: Bands of color that bend and fold into each other in a slow, flowing warp that leans toward your cursor.
---

Soft bands of color bend and fold into each other in a slow, flowing warp. Move the cursor over the effect and the pattern leans toward it and shifts a little in depth. Pass one color for a single glowing band, up to eight for a blend, or none for the built-in RGB bands.

::demo-color-bends
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/color-bends.json"
```

## Usage

```vue
<script setup lang="ts">
  import ColorBends from '~/components/ui/color-bends/ColorBends.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-black">
    <ColorBends
      :colors="['#5227FF', '#FF9FFC', '#7cff67']"
      :auto-rotate="2"
      :iterations="2"
    />
  </div>
</template>
```

## Props

| Prop              | Type       | Default | Description                                                        |
| ----------------- | ---------- | ------- | ------------------------------------------------------------------ |
| `colors`          | `string[]` | `[]`    | Up to 8 hex colors. Empty uses the built-in RGB bands.             |
| `rotation`        | `number`   | `90`    | Base rotation of the pattern, in degrees.                          |
| `auto-rotate`     | `number`   | `0`     | Extra rotation added every second, in degrees.                     |
| `speed`           | `number`   | `0.2`   | Animation speed.                                                   |
| `scale`           | `number`   | `1`     | Zoom of the pattern. Higher values zoom out.                       |
| `frequency`       | `number`   | `1`     | Frequency of the bends.                                            |
| `warp-strength`   | `number`   | `1`     | How strongly the bands warp.                                       |
| `mouse-influence` | `number`   | `1`     | How strongly the pattern pulls toward the cursor.                  |
| `parallax`        | `number`   | `0.5`   | How far the pattern shifts with the cursor.                        |
| `noise`           | `number`   | `0.15`  | Amount of film grain.                                              |
| `iterations`      | `number`   | `1`     | Extra folding passes, from 1 to 5. More passes add detail.         |
| `intensity`       | `number`   | `1.5`   | Brightness of the bands.                                           |
| `band-width`      | `number`   | `6`     | Sharpness of the bands. Higher values make thinner, crisper bands. |
| `transparent`     | `boolean`  | `true`  | Transparent canvas, so the page shows through between the bands.   |
| `class`           | `string`   | `''`    | Extra classes for the container.                                   |

## Accessibility

- The canvas is decorative and has `aria-hidden="true"`. Put real content on top of it.
- With `prefers-reduced-motion: reduce` the bands hold still; the cursor still nudges them.
- Rendering stops while the effect is off screen.

- Ported from [React Bits](https://reactbits.dev/backgrounds/color-bends) by David Haz.
