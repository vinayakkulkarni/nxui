---
title: Meta Balls
description: Liquid metaballs that merge, stretch and pinch apart, with a cursor blob that pushes through them.
---

Liquid blobs orbit, drift or rise like a lava lamp, clinging together, stretching as they move and wobbling when they snap apart. A cursor blob follows your pointer and pushes through them, and a click splashes them outward before they flow back. Pick filled, outline or contour styles.

::demo-meta-balls
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/meta-balls.json"
```

## Usage

```vue
<script setup lang="ts">
  import { MetaBalls } from '~/components/ui/meta-balls';
</script>

<template>
  <div class="relative h-120 w-full">
    <MetaBalls
      color="#ff5a1f"
      cursor-ball-color="#ff5a1f"
      motion="lava"
      :animation-size="16"
      :ball-count="9"
      enable-transparency
    />
  </div>
</template>
```

## Props

| Prop                       | Type                                | Default     | Description                                                                                      |
| -------------------------- | ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `color`                    | `string`                            | `'#ffffff'` | Color of the blobs.                                                                              |
| `cursor-ball-color`        | `string`                            | `'#ffffff'` | Color of the cursor blob. It blends smoothly into any blob it merges with.                       |
| `variant`                  | `'solid' \| 'outline' \| 'contour'` | `'solid'`   | Filled blobs, a single outline, or an outline with contour rings around it.                      |
| `motion`                   | `'orbit' \| 'drift' \| 'lava'`      | `'orbit'`   | Orbit a cluster, drift across the area, or rise and sink like a lava lamp.                       |
| `speed`                    | `number`                            | `0.3`       | Speed of the motion.                                                                             |
| `animation-size`           | `number`                            | `30`        | Size of the world shown in the view. Higher values zoom out and make the blobs smaller.          |
| `ball-count`               | `number`                            | `15`        | Number of blobs, up to 50.                                                                       |
| `clump-factor`             | `number`                            | `1`         | How far the blobs travel from the center. Lower values pack them together.                       |
| `gooeyness`                | `number`                            | `0.5`       | How far blobs reach toward each other before merging, from 0 to 1. 0.5 is the classic look.      |
| `stickiness`               | `number`                            | `0.5`       | How strongly merged blobs cling together before the neck between them snaps, from 0 to 1.        |
| `stretch`                  | `number`                            | `0.5`       | How much blobs stretch in the direction they move, from 0 to 1.                                  |
| `wobble`                   | `number`                            | `0.5`       | How much blobs jiggle after stretching or being pushed, from 0 to 1.                             |
| `enable-mouse-interaction` | `boolean`                           | `true`      | The cursor blob follows the pointer and pushes the others aside. It orbits on its own otherwise. |
| `cursor-ball-size`         | `number`                            | `3`         | Size of the cursor blob.                                                                         |
| `hover-smoothness`         | `number`                            | `0.1`       | How quickly the cursor blob catches up with the pointer. Lower is smoother.                      |
| `click-burst`              | `boolean`                           | `true`      | Clicking pulses the cursor blob and splashes the others outward before they flow back.           |
| `line-width`               | `number`                            | `1.5`       | Width of the lines in the outline and contour variants, in px.                                   |
| `rings`                    | `number`                            | `4`         | Number of contour rings around the outline.                                                      |
| `intro`                    | `boolean`                           | `true`      | Starts as a single drop that buds into the blobs.                                                |
| `enable-transparency`      | `boolean`                           | `false`     | Renders on a transparent background instead of black.                                            |
| `paused`                   | `boolean`                           | `false`     | Freezes the animation.                                                                           |
| `dpr`                      | `number`                            | auto        | Maximum device pixel ratio, capped at 2.                                                         |
| `class`                    | `string`                            | `''`        | Extra classes merged on the container.                                                           |

## Accessibility

- The canvas is decorative and marked `aria-hidden`; it never captures focus or blocks clicks.
- The intro is skipped when `prefers-reduced-motion: reduce` is set. Use `paused` to freeze the motion entirely.
- The render loop stops while the component is scrolled out of view.
- Needs WebGL2; without it the container stays empty.

- Ported from [React Bits](https://reactbits.dev/animations/meta-balls) by David Haz.
