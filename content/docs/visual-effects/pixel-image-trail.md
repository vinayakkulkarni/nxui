---
title: Pixel Image Trail
description: An image reveal made from cursor-painted squares that expire into a bounded pixel trail.
---

An image stays hidden behind a few dim fragments until you move across it. Squares of the image appear under the pointer and along its path, then fade away, so the trail stays expressive but bounded. Tabbing into focusable content inside it reveals the centre.

::demo-pixel-image-trail
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-image-trail.json"
```

## Usage

```vue
<script setup lang="ts">
  import PixelImageTrail from '~/components/ui/pixel-image-trail/PixelImageTrail.vue';
</script>

<template>
  <PixelImageTrail
    src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85"
    alt="A green mountain lake beneath a cloudy sky"
    :pixel-size="36"
    :fade-duration="900"
    class="h-screen"
  >
    <h2 class="p-8 text-4xl font-bold">Optional overlay content</h2>
  </PixelImageTrail>
</template>
```

The image is drawn into a 2D canvas with `object-fit: cover` math, one square at a time. The animation loop runs only while trail squares are fading, so an idle component costs nothing.

## Props

| Prop             | Type     | Default | Description                                             |
| ---------------- | -------- | ------- | ------------------------------------------------------- |
| `src`            | `string` | —       | Image URL revealed by the pixel trail.                  |
| `alt`            | `string` | —       | Accessible description for the image.                   |
| `pixel-size`     | `number` | `36`    | Width and height of each square in pixels (min 12).     |
| `radius`         | `number` | `58`    | Maximum distance for an occasional satellite pixel.     |
| `fade-duration`  | `number` | `900`   | Milliseconds before an untouched square disappears.     |
| `max-pixels`     | `number` | `84`    | Maximum squares retained before the oldest are removed. |
| `initial-pixels` | `number` | `24`    | Image fragments visible before the first interaction.   |
| `class`          | `string` | —       | Additional classes for size, surface, and shape.        |

## Slots

| Slot      | Description                                       |
| --------- | ------------------------------------------------- |
| `default` | Optional content rendered above the pixel canvas. |

## Accessibility

- The source image stays in the DOM (visually hidden) with its `alt` text, so screen readers announce it. The canvas is `aria-hidden`.
- Focus moving into slotted content paints the centre of the image; focus leaving clears the hover state.
- With `prefers-reduced-motion: reduce`, squares do not fade or spawn satellites: the trail shows only while the pointer is inside and clears when it leaves.
- The container uses `touch-pan-y`, so vertical page scrolling still works on touch screens.

- Ported from [componentry.fun](https://componentry.dev/docs/components/pixel-image-trail) by Harsh Jadhav.
