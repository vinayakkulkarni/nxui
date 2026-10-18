---
title: Crosshair
description: Crosshair cursor with live coordinates that locks onto links and buttons and measures them.
---

Two canvas-drawn lines follow the pointer with live x and y readouts at the edges. Hover a link, button or any `[data-crosshair-target]` element and the crosshair locks onto it with measuring brackets and its size; click to send out a pulse ring.

::demo-crosshair
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/crosshair.json"
```

## Usage

```vue
<script setup lang="ts">
  import { useTemplateRef } from 'vue';
  import Crosshair from '~/components/ui/crosshair/Crosshair.vue';

  const stage = useTemplateRef<HTMLElement>('stage');
</script>

<template>
  <!-- Scoped to one section: the container needs a non-static position -->
  <section ref="stage" class="relative h-110 overflow-hidden">
    <Crosshair :container="stage" target-effect="lock" :smoothing="0.35" />
    <h2 data-crosshair-target>Built to the pixel</h2>
    <button type="button">Get started</button>
  </section>

  <!-- Or across the whole viewport -->
  <Crosshair
    color="#22d3ee"
    line-style="dashed"
    blend-mode="difference"
    hide-cursor
  />
</template>
```

## Props

| Prop               | Type                              | Default                                | Description                                                                                                |
| ------------------ | --------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `color`            | `string`                          | `'#ffffff'`                            | Color of the lines, labels and brackets.                                                                   |
| `container`        | `HTMLElement \| null`             | `null`                                 | Keeps the crosshair inside this element (needs a non-static position). Without it, it covers the viewport. |
| `thickness`        | `number`                          | `1`                                    | Line thickness in px.                                                                                      |
| `opacity`          | `number`                          | `0.85`                                 | Opacity of everything the crosshair draws.                                                                 |
| `line-style`       | `'solid' \| 'dashed' \| 'dotted'` | `'solid'`                              | Stroke style of the two lines.                                                                             |
| `gap`              | `number`                          | `0`                                    | Empty space in px around the pointer where the lines would cross.                                          |
| `fade`             | `number`                          | `0`                                    | How much the lines fade toward the edges, from 0 to 1.                                                     |
| `smoothing`        | `number`                          | `0.35`                                 | How far the lines trail behind the pointer. 0 sticks to it.                                                |
| `show-coordinates` | `boolean`                         | `true`                                 | Shows the pointer position at the edges and the size of a locked target.                                   |
| `target-effect`    | `'lock' \| 'glitch' \| 'none'`    | `'lock'`                               | Lock frames a target with corner brackets and measures it; glitch shakes the lines like a bad signal.      |
| `target-selector`  | `string`                          | `'a, button, [data-crosshair-target]'` | CSS selector for the elements the crosshair reacts to.                                                     |
| `click-pulse`      | `boolean`                         | `true`                                 | Sends a ring out from the pointer on every click or tap.                                                   |
| `hide-cursor`      | `boolean`                         | `false`                                | Hides the system cursor inside the area and marks the pointer with a dot instead.                          |
| `blend-mode`       | `'normal' \| 'difference'`        | `'normal'`                             | Difference inverts whatever is under the lines so they stay visible on any background.                     |
| `class`            | `string`                          | `''`                                   | Extra classes for the canvas.                                                                              |

## Accessibility

- The overlay is a decorative `<canvas aria-hidden="true">` with `pointer-events: none`, so it never blocks clicks, focus or text selection.
- `hide-cursor` only hides the system cursor while the pointer is inside the area and always draws a replacement dot; leave it off for general content.
- With `prefers-reduced-motion: reduce` the lines snap to the pointer with no easing, and glitch shake and click rings are off.
- The render loop only runs while something is moving and stops when the pointer leaves.

- Ported from [React Bits](https://reactbits.dev/animations/crosshair) by David Haz.
