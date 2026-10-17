---
title: Blob Cursor
description: A 3D liquid blob follows the cursor, pulls into a tail as it moves, sheds drips and bursts into droplets on click — in chrome, jelly, pearl or ink.
---

A smooth 3D liquid replaces the cursor inside its container. It stretches into a curving tail as you move, wobbles when it stops, swells over links and buttons, and bursts into droplets when you click — then grows back and soaks the droplets up again. Move and click in the demo.

::demo-blob-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/blob-cursor.json"
```

## Usage

Place the component inside a positioned container. It fills the container, ignores pointer events and hides the system cursor of its parent element.

```vue
<script setup lang="ts">
  import BlobCursor from '~/components/ui/blob-cursor/BlobCursor.vue';
</script>

<template>
  <div class="relative h-125 w-full overflow-hidden">
    <BlobCursor material="jelly" color="#ff4fb8" :drip="0.6" />
  </div>
</template>
```

The blob renders with three.js: the head, tail and merging droplets are one signed-distance field ray-marched on a single plane, lit by a `RoomEnvironment` map. Flying droplets are an instanced sphere mesh. Add `data-blob-grow` to any element to make the blob swell over it, like it does over links and buttons.

## Props

| Prop             | Type                                                                             | Default     | Description                                                               |
| ---------------- | -------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `material`       | `'chrome' \| 'jelly' \| 'pearl' \| 'ink'`                                        | `'chrome'`  | Liquid metal, glossy gel, iridescent shell or flat goo                    |
| `color`          | `string`                                                                         | `'#3B82F6'` | Tints chrome and pearl reflections, fills jelly and ink                   |
| `blend`          | `'normal' \| 'difference' \| 'exclusion' \| 'multiply' \| 'screen' \| 'overlay'` | `'normal'`  | CSS `mix-blend-mode` of the blob layer                                    |
| `size`           | `number`                                                                         | `140`       | Diameter of the main blob in px (12–400)                                  |
| `morph`          | `number`                                                                         | `0`         | 0 = round bead, 1 = restless shapeshifting puddle                         |
| `morph-speed`    | `number`                                                                         | `0.4`       | How fast the shape keeps changing                                         |
| `depth`          | `number`                                                                         | `1`         | 0 = flat puddle, 1 = full round bead                                      |
| `trail`          | `number`                                                                         | `16`        | Links in the liquid tail (0–16)                                           |
| `lag`            | `number`                                                                         | `0.55`      | 0 = tight follow, 1 = slow and floaty                                     |
| `goo`            | `number`                                                                         | `1`         | How syrupy the joins between head, tail and droplets are                  |
| `stretch`        | `number`                                                                         | `0.6`       | How far the blob pulls into a teardrop while moving                       |
| `wobble`         | `number`                                                                         | `1`         | Bounce when it stops, turns or gets clicked                               |
| `drip`           | `number`                                                                         | `0`         | Droplets flung off the tail on fast moves; they dry up or get soaked back |
| `splash`         | `boolean`                                                                        | `true`      | Clicking bursts droplets out of the blob                                  |
| `splash-count`   | `number`                                                                         | `6`         | Droplets per click (1–32)                                                 |
| `splash-speed`   | `number`                                                                         | `0.5`       | 0 = gentle spill, 1 = hard burst                                          |
| `splash-size`    | `number`                                                                         | `0.5`       | Droplet size relative to the blob                                         |
| `splash-gravity` | `number`                                                                         | `0`         | Pulls flying droplets down into an arc                                    |
| `regrow`         | `number`                                                                         | `0.5`       | How quickly the blob regains its size after a splash                      |
| `shine`          | `number`                                                                         | `1`         | Strength of highlights and reflections                                    |
| `shadow`         | `boolean`                                                                        | `false`     | Casts a soft shadow under the blob                                        |
| `hide-cursor`    | `boolean`                                                                        | `true`      | Hides the system cursor on the parent element                             |
| `class`          | `string`                                                                         | `''`        | Extra classes for the root element                                        |

## Accessibility

- The canvas is `aria-hidden` and the layer has `pointer-events: none`, so it never blocks clicks or focus.
- With `prefers-reduced-motion: reduce` the blob follows the pointer tightly, does not morph, drip or burst on click.
- Rendering stops when the blob is idle or the container is off screen.
- Keep `hide-cursor` off on surfaces where users need a precise pointer.

- Ported from [React Bits](https://reactbits.dev/animations/blob-cursor) by David Haz.
