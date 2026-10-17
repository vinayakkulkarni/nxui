---
title: Threads
description: Flowing threads that fray apart and part around the cursor, from fine silk to contour lines.
---

A bundle of threads that flows across the screen and frays apart along its length. Every thread is one instanced strip in raw WebGL2, so even 400 threads stay fast. Set `parting` and the threads move aside around the cursor; turn on `enable-mouse-interaction` and the cursor steers the waves. Pick a preset in the demo panel, from fine Silk to Contour lines and a vertical Curtain.

::demo-threads
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/threads.json"
```

## Usage

```vue
<script setup lang="ts">
  import Threads from '~/components/ui/threads/Threads.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <Threads
      color="#ffffff"
      :line-count="90"
      :amplitude="1.7"
      :distance="0.4"
      :angle="25"
      :enable-mouse-interaction="true"
    />
  </div>
</template>
```

The demo presets ship with the component: `threadsPreset('contour')` returns the look of the Silk, Classic, Rope, Strands, Contour or Curtain preset.

## Props

| Prop                       | Type                 | Default     | Description                                                                    |
| -------------------------- | -------------------- | ----------- | ------------------------------------------------------------------------------ |
| `color`                    | `string \| number[]` | `[1, 1, 1]` | Color of the threads. Any CSS color, or an RGB array from 0 to 1.              |
| `accent-color`             | `string \| number[]` | -           | Color the outer threads blend toward. Leave it out for a single color.         |
| `line-count`               | `number`             | `90`        | Number of threads, from 1 to 400.                                              |
| `thickness`                | `number`             | `0.6`       | Width of the threads.                                                          |
| `softness`                 | `number`             | `1.3`       | How much the threads soften as they separate. 0 keeps every thread crisp.      |
| `amplitude`                | `number`             | `1.7`       | Height of the waves.                                                           |
| `distance`                 | `number`             | `0.4`       | Spacing between the threads. 0 starts them all from a single line.             |
| `waves`                    | `number`             | `1.05`      | How many waves run along each thread.                                          |
| `speed`                    | `number`             | `0.6`       | Animation speed. 0 holds the threads still.                                    |
| `split`                    | `number`             | `0.04`      | Where the first thread leaves the bundle, from 0 at the start to 1 at the end. |
| `fray`                     | `number`             | `0.5`       | How gradually the other threads peel away after the first one.                 |
| `angle`                    | `number`             | `25`        | Direction of the threads in degrees.                                           |
| `taper`                    | `number`             | `0.85`      | How much the outer threads fade away, from 0 for all equally bright to 1.      |
| `brightness`               | `number`             | `1.4`       | Brightness of the threads, from 0.25 to 2.                                     |
| `parting`                  | `number`             | `0`         | How far the threads move aside around the cursor, from 0 to 1.                 |
| `enable-mouse-interaction` | `boolean`            | `false`     | The cursor steers the waves: sideways shifts them, up and down changes height. |
| `fade`                     | `number`             | `0`         | Fades the edges into the page, from 0 to 1.                                    |
| `opacity`                  | `number`             | `1`         | Opacity of the whole effect.                                                   |
| `seed`                     | `number`             | `0`         | Changes the wave pattern.                                                      |
| `paused`                   | `boolean`            | `false`     | Freezes the animation.                                                         |
| `class`                    | `string`             | `''`        | Extra classes merged on the container.                                         |

## Accessibility

- The canvas is decorative and marked `aria-hidden="true"`. Put real content above it.
- The pointer listener is passive and sits on `window`, so the threads never take focus or clicks.
- With `prefers-reduced-motion: reduce` the threads hold still. The cursor can still part them.
- The render loop stops when the threads are paused and settled, offscreen or in a hidden tab.

- Ported from [React Bits](https://reactbits.dev/backgrounds/threads) by David Haz.
