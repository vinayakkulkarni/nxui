---
title: Shape Blur
description: A crisp logo or shape that drifts out of focus under the pointer like a camera lens.
---

A shape or logo is drawn sharp, and a lens around the pointer pushes the part beneath it out of focus with soft edges and a little color fringing. Move the pointer over or near it to steer the lens; while the pointer is away the lens drifts on its own. Use any SVG or transparent PNG as the shape, or turn on focus mode so the shape stays blurred and the pointer brings it into focus.

::demo-shape-blur
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shape-blur.json"
```

## Usage

```vue
<script setup lang="ts">
  import ShapeBlur from '~/components/ui/shape-blur/ShapeBlur.vue';
</script>

<template>
  <div class="relative h-125 w-full">
    <!-- Any SVG or transparent PNG -->
    <ShapeBlur src="/logo.svg" color="#ffffff" :size="0.6" fill />
  </div>

  <div class="relative h-100 w-full">
    <!-- A rectangle follows the container, so it works as a frame -->
    <ShapeBlur shape="rect" :echoes="4" :spacing="10" color="#ffffff">
      <h2 class="text-4xl font-semibold">Out of focus</h2>
    </ShapeBlur>
  </div>
</template>
```

The canvas fills its parent, so give the parent a size. An image used as `src` must be same-origin or served with CORS headers, because its silhouette is read from the pixels and traced into a distance field.

## Props

| Prop            | Type                                        | Default     | Description                                                                                            |
| --------------- | ------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `shape`         | `'rect' \| 'circle' \| 'polygon' \| 'star'` | `'rect'`    | Shape to draw. A rectangle follows the container so it works as a frame.                               |
| `src`           | `string`                                    | `undefined` | URL of an SVG or transparent PNG to use as the shape instead. Outline, echoes and blur all work on it. |
| `sides`         | `number`                                    | `6`         | Sides of the polygon or points of the star (3 to 12).                                                  |
| `size`          | `number`                                    | `0.8`       | How much of the container the shape fills, from 0 to 1. 1 reaches the edges.                           |
| `roundness`     | `number`                                    | `0.2`       | Rounds the corners, from 0 to 1.                                                                       |
| `thickness`     | `number`                                    | `2`         | Line width in pixels.                                                                                  |
| `fill`          | `boolean`                                   | `false`     | Fills the shape instead of drawing its outline.                                                        |
| `echoes`        | `number`                                    | `1`         | Number of lines. Outlines nest inward and filled shapes ripple outward.                                |
| `spacing`       | `number`                                    | `12`        | Distance between echoes in pixels.                                                                     |
| `color`         | `string`                                    | `'#ffffff'` | Line color, any CSS color. Dark colors are drawn for light backgrounds.                                |
| `blur`          | `number`                                    | `16`        | How far out of focus the lens pushes the shape, in pixels.                                             |
| `lens-size`     | `number`                                    | `0.3`       | Radius of the lens around the pointer, relative to the shorter side of the container.                  |
| `lens-softness` | `number`                                    | `0.7`       | How gradually the blur fades out toward the edge of the lens, from 0 to 1.                             |
| `focus`         | `boolean`                                   | `false`     | Inverts the lens: the shape stays blurred and the pointer brings it into focus.                        |
| `chroma`        | `number`                                    | `0.3`       | Color fringing in the blurred parts, like a real lens, from 0 to 1.                                    |
| `rotation`      | `number`                                    | `0`         | Rotation of the shape in degrees.                                                                      |
| `spin`          | `number`                                    | `0`         | Rotation speed in degrees per second.                                                                  |
| `idle`          | `boolean`                                   | `true`      | Lets the lens drift on its own while the pointer is away.                                              |
| `class`         | `string`                                    | `''`        | Extra classes for the container.                                                                       |

## Slots

| Slot      | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `default` | Content centered on top of the shape, for example a headline in a frame. |

## Accessibility

- The canvas is decorative (`aria-hidden`) and ignores pointer events, so slot content stays clickable and selectable.
- With `prefers-reduced-motion: reduce` the lens does not drift and `spin` is ignored; the lens still follows the pointer.
- Rendering stops while the component is offscreen, and the WebGL context is released on unmount.

- Ported from [React Bits](https://reactbits.dev/animations/shape-blur) by David Haz.
