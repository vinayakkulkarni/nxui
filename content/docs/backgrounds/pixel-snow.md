---
title: Pixel Snow
description: Pixel-art snowflakes drifting down in layers of depth, brushed aside by the cursor.
---

Crisp pixel-art snowflakes fall in five layers of depth on raw WebGL2: far flakes are small, slow and dim, near ones are large crystals that sparkle as they catch the light. A soft glow sits around every flake. Move the cursor through the snow to brush it aside and stir it along, and turn on `accumulate` to let it pile up in drifts along the bottom edge.

::demo-pixel-snow
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-snow.json"
```

## Usage

```vue
<script setup lang="ts">
  import PixelSnow from '~/components/ui/pixel-snow/PixelSnow.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-zinc-950">
    <PixelSnow
      color="#ffffff"
      variant="snowflake"
      :density="0.5"
      :wind="0.25"
      :glow="0.8"
      :twinkle="0.35"
    />
  </div>
</template>
```

On a light page, set `light-mode` and pick a deeper color such as `#7f9cc4` so the flakes read as colored pixels instead of light. Rendering stops when nothing moves, when the tab is hidden and while the snow is scrolled out of view.

## Props

| Prop                | Type                                 | Default       | Description                                                                       |
| ------------------- | ------------------------------------ | ------------- | --------------------------------------------------------------------------------- |
| `color`             | `string`                             | `'#ffffff'`   | Color of the snow. Any CSS color.                                                 |
| `variant`           | `'snowflake' \| 'square' \| 'round'` | `'snowflake'` | Shape of the flakes: pixel crystals, square pixels or round pixels.               |
| `density`           | `number`                             | `0.5`         | How much snow is falling, from 0 to 1.                                            |
| `speed`             | `number`                             | `1`           | How fast the snow falls. Negative values make it rise.                            |
| `wind`              | `number`                             | `0.25`        | Sideways drift, from -2 to 2. Negative values blow to the left.                   |
| `sway`              | `number`                             | `0.5`         | How much each flake swings as it falls.                                           |
| `flake-size`        | `number`                             | `1`           | Size of the flakes, from 0 for mostly tiny specks to 2 for mostly large crystals. |
| `pixel-size`        | `number`                             | `3`           | Size of one snow pixel in px, from 1 to 12.                                       |
| `depth`             | `number`                             | `0.6`         | How strongly far flakes fall slower and dimmer than near ones, from 0 to 1.       |
| `brightness`        | `number`                             | `1`           | Overall brightness of the snow.                                                   |
| `glow`              | `number`                             | `0.8`         | Strength of the soft light around each flake.                                     |
| `twinkle`           | `number`                             | `0.35`        | How often flakes catch the light and sparkle, from 0 to 1.                        |
| `accumulate`        | `boolean`                            | `false`       | Lets the snow pile up in soft drifts along the bottom edge.                       |
| `mouse-interaction` | `boolean`                            | `true`        | Lets the cursor brush the snow aside and stir it as it moves.                     |
| `intro`             | `boolean`                            | `true`        | Lets the snow drift in from the top on mount.                                     |
| `fade`              | `number`                             | `0`           | Fades the edges into the page, from 0 to 1.                                       |
| `opacity`           | `number`                             | `1`           | Opacity of the whole effect, from 0 to 1.                                         |
| `light-mode`        | `boolean`                            | `false`       | Draws the snow as colored pixels for light backgrounds.                           |
| `paused`            | `boolean`                            | `false`       | Freezes the snow in place.                                                        |
| `dpr`               | `number`                             | auto          | Maximum device pixel ratio, capped at 2.                                          |
| `class`             | `string`                             | `''`          | Extra classes for the container.                                                  |

## Accessibility

- The canvas is `aria-hidden`. Put real content on top of it in your own markup.
- Pointer input is read from `window`, so content layered on top stays fully interactive while the cursor still brushes the snow.
- With `prefers-reduced-motion: reduce` the snow holds still, and the intro and cursor push are turned off.

- Ported from [React Bits](https://reactbits.dev/backgrounds/pixel-snow) by David Haz.
