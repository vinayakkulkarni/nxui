---
title: Waves
description: Dense flowing lines that sway like silk, bend around the cursor and spring back into place.
---

Hundreds of fine lines drawn with raw WebGL2. Each line sways along a flowing noise field. Move the cursor and the lines bend with it, then spring back. Click and the lines part in a soft ripple. The lines open from the center and the waves swell in on mount. Lines can be solid or dashed, turned to any angle, and drawn as ink for light pages. Pick a preset in the demo panel, or press refresh to replay the intro.

::demo-waves
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/waves.json"
```

## Usage

```vue
<script setup lang="ts">
  import Waves from '~/components/ui/waves/Waves.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-black">
    <Waves
      line-color="#ffffff"
      accent-color="#ffffff"
      :spacing="10"
      :amplitude="32"
      :mouse-radius="175"
      :click-ripple="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `wavesPreset('silk')` returns the shape props of the Classic, Silk, Tide, Rain or Dune preset.

## Props

| Prop                | Type                  | Default         | Description                                                           |
| ------------------- | --------------------- | --------------- | --------------------------------------------------------------------- |
| `line-color`        | `string`              | `'#ffffff'`     | Color of the lines.                                                   |
| `accent-color`      | `string`              | `line-color`    | Color the lines take on where the cursor or a click pushes them.      |
| `background-color`  | `string`              | `'transparent'` | Background behind the lines.                                          |
| `line-style`        | `'solid' \| 'dashed'` | `'solid'`       | Draws solid lines, or dashes that stream along them.                  |
| `spacing`           | `number`              | `10`            | Space between the lines, in px.                                       |
| `line-width`        | `number`              | `1`             | Width of the lines, in px.                                            |
| `rotation`          | `number`              | `0`             | Turns the lines, in degrees. `90` lays them flat.                     |
| `amplitude`         | `number`              | `32`            | How far the lines sway, in px.                                        |
| `scale`             | `number`              | `1`             | Size of the wave pattern. Higher values make broader, calmer waves.   |
| `twist`             | `number`              | `1`             | How much the waves twist the lines, gathering them into bright folds. |
| `speed`             | `number`              | `1`             | How fast the waves flow. `0` holds them still.                        |
| `variation`         | `number`              | `0`             | Picks a different wave pattern.                                       |
| `mouse-interaction` | `boolean`             | `true`          | Moving the cursor drags the lines along with it.                      |
| `mouse-radius`      | `number`              | `175`           | Radius around the cursor that drags the lines, in px.                 |
| `mouse-strength`    | `number`              | `1`             | How hard a moving cursor drags the lines.                             |
| `bounce`            | `number`              | `0.5`           | How much the lines overshoot and wobble as they settle, from 0 to 1.  |
| `return-duration`   | `number`              | `1.4`           | Roughly how long the lines take to settle back, in seconds.           |
| `click-ripple`      | `boolean`             | `true`          | Clicking parts the lines in a soft ripple.                            |
| `intro`             | `boolean`             | `true`          | Opens the lines from the center and swells the waves in on mount.     |
| `fade`              | `number`              | `0`             | Fades the edges into the page, from 0 to 1.                           |
| `opacity`           | `number`              | `1`             | Opacity of the whole effect.                                          |
| `light-mode`        | `boolean`             | `false`         | Draws the lines as ink for light backgrounds.                         |
| `paused`            | `boolean`             | `false`         | Freezes the waves.                                                    |
| `dpr`               | `number`              | auto            | Maximum device pixel ratio, capped at 2.                              |
| `class`             | `string`              | `''`            | Extra classes merged on the container.                                |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- Pointer listeners are passive and sit on `window`, so the lines never take focus or block clicks on content above them.
- With `prefers-reduced-motion: reduce` there is no intro, no flowing motion, cursor drag or click ripple. The lines are drawn once and hold still.
- The render loop stops when the waves are paused, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/waves) by David Haz.
