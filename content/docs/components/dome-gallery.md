---
title: Dome Gallery
description: Immersive 3D dome gallery projecting images on a hemispheric surface. Drag to spin it with inertia and click a tile to fly it out into a centered viewer.
---

A gallery of images laid out on the inside of a 3D dome. Drag to spin the dome; it keeps turning with inertia when you let go. Click (or press Enter on) a tile and it turns to face you, then grows into a centered viewer. Click the backdrop or press Escape to send it back to its place.

::demo-dome-gallery
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dome-gallery.json"
```

## Usage

```vue
<script setup lang="ts">
  import DomeGallery from '~/components/ui/dome-gallery/DomeGallery.vue';

  const images = [
    { src: '/photos/one.jpg', alt: 'Harbour at dawn' },
    { src: '/photos/two.jpg', alt: 'Desert road' },
    '/photos/three.jpg',
  ];
</script>

<template>
  <div class="relative h-150 w-full">
    <DomeGallery
      :images="images"
      :fit="0.8"
      :segments="34"
      :max-vertical-rotation-deg="0"
      overlay-blur-color="#120F17"
      grayscale
    />
  </div>
</template>
```

The gallery fills its parent, so give the parent a height.

## Props

| Prop                         | Type                                              | Default     | Description                                                        |
| ---------------------------- | ------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `images`                     | `(string \| GalleryImage)[]`                      | 7 samples   | Image URLs, or objects with `src` and optional `alt`.              |
| `fit`                        | `number`                                          | `0.5`       | Size factor for the dome radius based on the container size.       |
| `fit-basis`                  | `'auto' \| 'min' \| 'max' \| 'width' \| 'height'` | `'auto'`    | Which container dimension the radius is based on.                  |
| `min-radius`                 | `number`                                          | `600`       | Minimum dome radius in pixels.                                     |
| `max-radius`                 | `number`                                          | `Infinity`  | Maximum dome radius in pixels.                                     |
| `pad-factor`                 | `number`                                          | `0.25`      | Padding around the viewer frame, as a share of the smaller side.   |
| `overlay-blur-color`         | `string`                                          | `'#120F17'` | Background, vignette and edge-fade color. Match your page.         |
| `max-vertical-rotation-deg`  | `number`                                          | `5`         | Maximum vertical tilt in degrees.                                  |
| `drag-sensitivity`           | `number`                                          | `20`        | Pixels of drag per degree of rotation. Higher is slower.           |
| `enlarge-transition-ms`      | `number`                                          | `300`       | Duration of the open and close transitions in milliseconds.        |
| `segments`                   | `number`                                          | `35`        | Number of columns around the dome.                                 |
| `drag-dampening`             | `number`                                          | `2`         | Inertia damping after a drag (clamped to 0–1, higher glides more). |
| `opened-image-width`         | `string`                                          | `'400px'`   | Width of the enlarged image.                                       |
| `opened-image-height`        | `string`                                          | `'400px'`   | Height of the enlarged image.                                      |
| `image-border-radius`        | `string`                                          | `'30px'`    | Corner radius of the tiles.                                        |
| `opened-image-border-radius` | `string`                                          | `'30px'`    | Corner radius of the enlarged image.                               |
| `grayscale`                  | `boolean`                                         | `true`      | Render every image in grayscale.                                   |
| `class`                      | `string`                                          | `''`        | Extra classes for the root.                                        |

## Accessibility

- Every tile is a focusable `role="button"` labelled with its `alt` text. Enter or Space opens it; Escape closes the viewer.
- With `prefers-reduced-motion: reduce`, drag inertia and the tile turn transitions are switched off.

- Ported from [React Bits](https://reactbits.dev/components/dome-gallery) by David Haz.
