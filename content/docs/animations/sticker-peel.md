---
title: Sticker Peel
description: A die-cut sticker you can peel at any edge, drag, throw and swing, in gloss, matte or holographic finishes.
---

A die-cut sticker rendered in WebGL 2. Hover it to peel back the edge nearest your cursor, then drag and throw it: it swings around the point you hold, slides and bounces off the edges of its parent. Pick a gloss, matte or holographic finish.

::demo-sticker-peel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/sticker-peel.json"
```

## Usage

```vue
<script setup lang="ts">
  import StickerPeel from '~/components/ui/sticker-peel/StickerPeel.vue';

  const onDrop = () => console.log('sticker dropped');
</script>

<template>
  <div class="relative h-100 w-full overflow-hidden">
    <StickerPeel
      image-src="/stickers/nxui.png"
      finish="gloss"
      :width="200"
      :curl-radius="12"
      @drag-end="onDrop"
    />
  </div>
</template>
```

Use an image with a transparent background: the alpha channel sets the die-cut outline, the hit area and the shadow. The sticker positions itself inside its nearest parent, so give that parent a real size and `position: relative`.

## Props

| Prop                   | Type                                   | Default     | Description                                                                                   |
| ---------------------- | -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `image-src`            | `string`                               | required    | Sticker image. Use a PNG with a transparent background so the die-cut outline shows.          |
| `width`                | `number`                               | `200`       | Width of the sticker in pixels. Minimum 16.                                                   |
| `rotate`               | `number`                               | `0`         | Resting rotation of the sticker in degrees.                                                   |
| `finish`               | `'gloss' \| 'matte' \| 'holo'`         | `'gloss'`   | Surface of the sticker. Holo turns light areas into foil with rainbow bands and glitter.      |
| `back-color`           | `string`                               | `'#d4d4d8'` | Color of the back of the sticker, seen on the peeled part.                                    |
| `peel-direction`       | `number`                               | `0`         | Edge that peels, in degrees clockwise from the top.                                           |
| `peel-back-hover-pct`  | `number`                               | `25`        | How far the sticker peels back on hover, as a percentage of its size.                         |
| `peel-back-active-pct` | `number`                               | `40`        | How far the sticker peels back while pressed or dragged.                                      |
| `curl-radius`          | `number`                               | `12`        | Radius of the curl where the sticker bends, in pixels. Larger values feel like thicker vinyl. |
| `lighting-intensity`   | `number`                               | `0.5`       | Strength of the highlights that follow the cursor, from 0 to 1.                               |
| `shadow-intensity`     | `number`                               | `0.6`       | Strength of the shadows under the sticker and the peeled part, from 0 to 1.                   |
| `follow-pointer`       | `boolean`                              | `true`      | Peels the edge or corner nearest the cursor, and the edge you grab while dragging.            |
| `draggable`            | `boolean`                              | `true`      | Lets the sticker be picked up, dragged and thrown around its parent.                          |
| `swing`                | `number`                               | `1`         | How much the sticker swings around the point you hold while dragging, from 0 to 3.            |
| `friction`             | `number`                               | `0.5`       | How quickly a thrown sticker slides to a stop, from 0 (ice) to 1 (felt).                      |
| `bounce`               | `number`                               | `0.35`      | How much of its speed a thrown sticker keeps when it hits the edge of its parent.             |
| `intro`                | `boolean`                              | `true`      | Drops the sticker onto the surface on mount and smooths its corner down.                      |
| `initial-position`     | `'center' \| { x: number; y: number }` | `'center'`  | Starting position. An object offsets the sticker from the center of its parent, in pixels.    |
| `dpr`                  | `number`                               | `auto`      | Maximum device pixel ratio, capped at 2.                                                      |
| `class`                | `string`                               | `''`        | Extra classes for the root element.                                                           |
| `style`                | `CSSProperties`                        | `-`         | Inline styles for the root element.                                                           |

## Events

| Event        | Payload | Description                                  |
| ------------ | ------- | -------------------------------------------- |
| `drag-start` | none    | Fired when the sticker starts being dragged. |
| `drag-end`   | none    | Fired when a dragged sticker is released.    |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. Add a visible caption or an `aria-label` on a parent if the sticker carries meaning.
- With `prefers-reduced-motion: reduce` the intro is skipped and the sticker rests flat.
- The render loop stops while the sticker is offscreen or idle, and the WebGL context is released on unmount.
- Needs WebGL 2. Without it the component renders nothing.

- Ported from [React Bits](https://reactbits.dev/animations/sticker-peel) by David Haz.
