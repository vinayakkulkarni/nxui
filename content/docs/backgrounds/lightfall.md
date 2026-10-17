---
title: Lightfall
description: Streaks of light falling down a curved tunnel, bending around the cursor and stretching into warp trails on hold.
---

Crisp streaks with round glowing heads fall down a curved tunnel. The light warps in on load, bends like a lens around the cursor, and stretches into warp trails while you hold the pointer down.

::demo-lightfall
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/lightfall.json"
```

## Usage

```vue
<script setup lang="ts">
  import Lightfall from '~/components/ui/lightfall/Lightfall.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden bg-zinc-950">
    <Lightfall
      :colors="['#ffffff', '#c4d0ff', '#8b7bff']"
      background-color="#4630ff"
      :speed="0.5"
      :twinkle="1"
      :bloom="0.5"
      hold-to-warp
    />
  </div>
</template>
```

The streaks render into a transparent WebGL2 canvas, so the container's
background shows through. Set `light-mode` on light pages: the streaks are
then drawn as colored ink on a white background.

## Props

| Prop                | Type       | Default       | Description                                                      |
| ------------------- | ---------- | ------------- | ---------------------------------------------------------------- |
| `colors`            | `string[]` | `['#ffffff']` | Colors of the falling streaks, up to 8. Each streak picks one.   |
| `background-color`  | `string`   | `'#94a3b8'`   | Color of the soft light glowing at the top.                      |
| `speed`             | `number`   | `0.3`         | How fast the streaks fall.                                       |
| `streak-count`      | `number`   | `2`           | Layers of streaks, from 1 to 16. More layers fill the tunnel.    |
| `streak-width`      | `number`   | `0.8`         | Thickness of the streaks.                                        |
| `streak-length`     | `number`   | `1`           | Length of the glowing tails.                                     |
| `density`           | `number`   | `0.6`         | How closely the streaks follow each other down the tunnel.       |
| `twinkle`           | `number`   | `0.3`         | How much the streaks flicker, from 0 to 1.                       |
| `glow`              | `number`   | `1`           | Overall brightness.                                              |
| `background-glow`   | `number`   | `0.1`         | Brightness of the soft light at the top. 0 turns it off.         |
| `head-glow`         | `number`   | `0.6`         | How white-hot the leading tips burn, from 0 to 1.                |
| `depth`             | `number`   | `0.5`         | Dims streaks deep in the tunnel so the near ones stand out.      |
| `bloom`             | `number`   | `0.35`        | Soft glow around the brightest tips.                             |
| `zoom`              | `number`   | `3`           | Field of view into the tunnel. Higher values zoom further in.    |
| `opacity`           | `number`   | `1`           | Opacity of the whole effect.                                     |
| `mouse-interaction` | `boolean`  | `true`        | The cursor bends the light and brightens nearby streaks.         |
| `mouse-strength`    | `number`   | `0.4`         | How much the cursor brightens nearby streaks.                    |
| `mouse-radius`      | `number`   | `0.45`        | Reach of the cursor light.                                       |
| `mouse-dampening`   | `number`   | `0.15`        | Seconds the cursor light takes to catch up. 0 follows instantly. |
| `lens`              | `number`   | `0.5`         | How strongly the cursor bends the streaks.                       |
| `hold-to-warp`      | `boolean`  | `true`        | Holding the pointer down speeds the streaks into warp trails.    |
| `intro`             | `boolean`  | `true`        | The light arrives at warp speed and slows to a steady fall.      |
| `fade`              | `number`   | `0`           | Fades the edges into the page, from 0 to 1.                      |
| `light-mode`        | `boolean`  | `false`       | Draws the streaks as colored light on a white background.        |
| `mix-blend-mode`    | `string`   | `undefined`   | CSS blend mode for the container, such as `screen`.              |
| `paused`            | `boolean`  | `false`       | Freezes the animation.                                           |
| `dpr`               | `number`   | auto          | Maximum device pixel ratio, capped at 2.                         |
| `class`             | `string`   | `''`          | Extra classes for the container.                                 |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`.
- With `prefers-reduced-motion: reduce` the streaks hold still, the intro
  and warp are skipped, and the cursor lens is disabled.
- The render loop pauses when the canvas is off screen or the tab is hidden,
  and stops entirely once the light is settled and `speed` is 0.

- Ported from [React Bits](https://reactbits.dev/backgrounds/lightfall) by David Haz.
