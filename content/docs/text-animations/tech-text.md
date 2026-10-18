---
title: Tech Text
description: A canvas wordmark whose letters turn into dashed vector outlines under the cursor, with a gliding selection frame, draggable spring letters and click ripples.
---

A wordmark drawn on a canvas. Move the pointer over it and the letter under the cursor turns into its dashed outline inside a selection frame with blinking specks. Drag a letter off the baseline and it springs home; click a letter to kick it up and ripple its neighbours. With the pointer away, the reveal sweeps across the word on its own. Pick an intro to type, assemble or rule the font metrics on load.

::demo-tech-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/tech-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import TechText from '~/components/ui/tech-text/TechText.vue';
</script>

<template>
  <div class="relative h-120 w-full text-foreground">
    <TechText
      text="nxui"
      :font-weight="600"
      reveal="letter"
      line-style="dashed"
      :specks="15"
      intro="assemble"
      :intro-duration="2.2"
    />
  </div>
</template>
```

The component fills its parent, so give the parent a height. Colours default to `currentColor`, so the wordmark follows the surrounding text colour in light and dark mode.

## Props

| Prop             | Type                                          | Default          | Description                                                                                                                                                                                               |
| ---------------- | --------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`           | `string`                                      | `'nxui'`         | The wordmark to render.                                                                                                                                                                                   |
| `font-family`    | `string`                                      | `''`             | Any font family loaded on the page. Empty inherits the font of the container.                                                                                                                             |
| `font-weight`    | `number`                                      | `600`            | Weight of the wordmark.                                                                                                                                                                                   |
| `font-size`      | `number`                                      | `150`            | Largest font size in px. The wordmark shrinks to fit narrower containers.                                                                                                                                 |
| `letter-spacing` | `number`                                      | `-0.05`          | Extra space between letters, in em.                                                                                                                                                                       |
| `align`          | `'left' \| 'center' \| 'right'`               | `'center'`       | Where the wordmark sits across the container.                                                                                                                                                             |
| `color`          | `string`                                      | `'currentColor'` | Colour of the letters and their outlines.                                                                                                                                                                 |
| `accent-color`   | `string`                                      | `'currentColor'` | Colour of the selection frame, connector, specks and labels.                                                                                                                                              |
| `reveal`         | `'area' \| 'letter' \| 'off'`                 | `'letter'`       | `area` fades letters into outlines inside a circle around the pointer, `letter` outlines only the active letter, `off` keeps every letter solid.                                                          |
| `reach`          | `number`                                      | `200`            | Radius of the area reveal, in px.                                                                                                                                                                         |
| `softness`       | `number`                                      | `0.7`            | How gradually the fill hands over to the outlines. 0 is a hard edge.                                                                                                                                      |
| `dash-length`    | `number`                                      | `4`              | Length of each outline dash, in px.                                                                                                                                                                       |
| `dash-gap`       | `number`                                      | `2`              | Space between outline dashes, in px.                                                                                                                                                                      |
| `line-style`     | `'dashed' \| 'solid'`                         | `'dashed'`       | How the outlines are drawn. Only the outer silhouette is traced.                                                                                                                                          |
| `stroke-width`   | `number`                                      | `1.5`            | Thickness of the outline, in px.                                                                                                                                                                          |
| `specks`         | `number`                                      | `15`             | Squares that blink and respawn around the active letter, seeded per letter. 0 turns them off.                                                                                                             |
| `selection`      | `boolean`                                     | `true`           | Frame the letter under the pointer. The frame glides from letter to letter.                                                                                                                               |
| `labels`         | `boolean`                                     | `true`           | Label the frame with the letter and its size, or with its offset while dragged.                                                                                                                           |
| `draggable`      | `boolean`                                     | `true`           | Let letters be dragged off the baseline. They spring back on release.                                                                                                                                     |
| `bounce`         | `number`                                      | `0.4`            | How much a released letter overshoots on its way home, from 0 to 1.                                                                                                                                       |
| `click-kick`     | `boolean`                                     | `true`           | Clicking a letter kicks it upward and sends a ripple through its neighbours.                                                                                                                              |
| `intro`          | `'none' \| 'type' \| 'assemble' \| 'metrics'` | `'none'`         | Entrance played once the wordmark is in view: `type` places each letter as an outline, `assemble` flies pixel specks into the letters, `metrics` rules the font lines and fills the letters zone by zone. |
| `intro-duration` | `number`                                      | `2`              | Length of the intro, in seconds.                                                                                                                                                                          |
| `guides`         | `boolean`                                     | `false`          | Rule the baseline, x-height, cap height and descender while a letter is active.                                                                                                                           |
| `sweep`          | `boolean`                                     | `true`           | Sweep the reveal across the wordmark on its own while the pointer is away.                                                                                                                                |
| `speed`          | `number`                                      | `1`              | Speed of the idle sweep.                                                                                                                                                                                  |
| `class`          | `string`                                      | `''`             | Extra classes on the container.                                                                                                                                                                           |

## Accessibility

- The container has `role="img"` and uses `text` as its `aria-label`; the canvas is hidden from assistive tech.
- With `prefers-reduced-motion: reduce`, the intro, the idle sweep and the click ripple are skipped. Hover and drag still work.
- The animation loop only runs while the wordmark is on screen and something is moving.

- Ported from [React Bits](https://reactbits.dev/text-animations/tech-text) by David Haz.
