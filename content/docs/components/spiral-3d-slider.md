---
title: Spiral 3D Slider
description: An autoplaying image gallery that flows along a 3D spiral of curved WebGL planes and responds to wheel and page scroll.
---

A three.js gallery that threads your images along a helix: the front image sits sharp and full size, the rest curve away, shrink and blur with distance. It drifts on its own while idle; scroll the wheel over it (or scroll the page while it is visible) to move along the spiral.

::demo-spiral-3d-slider
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/spiral-3d-slider.json"
```

## Usage

```vue
<script setup lang="ts">
  import Spiral3dSlider from '~/components/ui/spiral-3d-slider/Spiral3dSlider.vue';
  import type { Spiral3dSlide } from '~/components/ui/spiral-3d-slider/types';

  // Local files or remote image URLs both work.
  const slides: Spiral3dSlide[] = [
    { src: '/images/gallery/photo-01.jpg', alt: 'Describe the first image' },
    { src: '/images/gallery/photo-02.jpg', alt: 'Describe the second image' },
    { src: '/images/gallery/photo-03.jpg', alt: 'Describe the third image' },
  ];
</script>

<template>
  <Spiral3dSlider
    :items="slides"
    auto-rotate
    :auto-speed="0.13"
    class="min-h-180"
  />
</template>
```

Fewer than 16 images are repeated to fill the spiral. Remote images must allow
cross-origin loading, because they are uploaded as WebGL textures.

## Props

| Prop                 | Type              | Default                  | Description                                         |
| -------------------- | ----------------- | ------------------------ | --------------------------------------------------- |
| `items`              | `Spiral3dSlide[]` | required                 | Images (`{ src, alt }`) arranged along the spiral   |
| `radius`             | `number`          | `235`                    | Maximum horizontal radius of the spiral in pixels   |
| `vertical-gap`       | `number`          | `64`                     | Vertical pitch between neighboring images in pixels |
| `card-width`         | `number`          | `255`                    | Maximum width of each image plane in pixels         |
| `card-aspect-ratio`  | `number`          | `1.5`                    | Width divided by height for every image plane       |
| `auto-rotate`        | `boolean`         | `true`                   | Advance the spiral while idle                       |
| `auto-speed`         | `number`          | `0.13`                   | Automatic movement in slides per second             |
| `scroll-sensitivity` | `number`          | `0.0024`                 | Spiral movement per pixel of wheel or page scroll   |
| `smoothing`          | `number`          | `0.065`                  | Interpolation strength (0–1) for the motion         |
| `blur-strength`      | `number`          | `1.65`                   | Maximum blur applied as images move away from focus |
| `bend`               | `number`          | `0.17`                   | How far each segmented plane curves into the spiral |
| `fov`                | `number`          | `44`                     | Perspective camera field of view in degrees         |
| `aria-label`         | `string`          | `'Spiral image gallery'` | Accessible name for the gallery region              |
| `class`              | `string`          | `''`                     | Additional classes for the stage                    |

## Accessibility

- The stage is a `region` labelled by `aria-label`; every image's `alt` text is listed in a visually hidden list, since the canvas itself is not readable.
- With `prefers-reduced-motion: reduce`, auto-rotation stops and scroll moves the spiral without easing.
- Rendering pauses while the gallery is off screen, and all textures, geometry and the WebGL context are released on unmount.
- If WebGL is unavailable, a short status message replaces the canvas.

## Credits

- Ported from [componentry.fun](https://componentry.dev/docs/components/spiral-3d-slider) by Harsh Jadhav.
