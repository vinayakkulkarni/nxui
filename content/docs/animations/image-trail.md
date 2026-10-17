---
title: Image Trail
description: A trail of photos that appears behind the cursor, with tunable size, timing, zoom, flash, drift, 3D tilt, rotation and a stacking pile.
---

Move the cursor (or drag a finger) across the area and photos drop in behind it, then fade away. One tunable trail replaces the old fixed variants: change how big and how long the photos stay, let them pop in with a zoom and flash, drift after the cursor, tilt in 3D, turn to face the motion, or pile up in a stack. Try the four presets in the panel.

::demo-image-trail
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/image-trail.json"
```

## Usage

The trail fills its parent, so give the parent a height.

```vue
<script setup lang="ts">
  import ImageTrail from '~/components/ui/image-trail/ImageTrail.vue';

  const items = [
    'https://picsum.photos/id/287/300/300',
    'https://picsum.photos/id/1001/300/300',
    'https://picsum.photos/id/1025/300/300',
    'https://picsum.photos/id/1026/300/300',
  ];
</script>

<template>
  <div class="relative h-100 overflow-hidden">
    <!-- "Pop" preset -->
    <ImageTrail :items="items" :appear-scale="0" :zoom="2.4" :flash="0.6" />
  </div>
</template>
```

## Props

| Prop              | Type               | Default | Description                                                                                   |
| ----------------- | ------------------ | ------- | --------------------------------------------------------------------------------------------- |
| `items`           | `string[]`         | `[]`    | Image URLs shown in the trail, in order.                                                      |
| `size`            | `number \| string` | `190`   | Width of each image in px, or any CSS length.                                                 |
| `aspect-ratio`    | `number`           | `1.1`   | Width divided by height for each image.                                                       |
| `radius`          | `number \| string` | `15`    | Corner radius of the images.                                                                  |
| `threshold`       | `number`           | `80`    | How far the cursor travels, in px, before the next image appears.                             |
| `lifetime`        | `number`           | `0.4`   | Seconds an image stays before it fades out.                                                   |
| `appear-scale`    | `number`           | `1`     | Size an image starts at as it appears. 0 grows it from nothing, 1 shows it at full size.      |
| `zoom`            | `number`           | `1`     | How far each photo starts zoomed in before settling inside its frame. 1 turns it off.         |
| `flash`           | `number`           | `0`     | Brightness flash as an image appears, from 0 to 1.                                            |
| `exit-scale`      | `number`           | `0.2`   | Size an image shrinks or grows to while it fades out. 1 keeps its size.                       |
| `drift`           | `number`           | `0`     | How far images keep flying in the direction of the cursor as they fade, from 0 to 1.          |
| `rotation`        | `number`           | `0`     | Random tilt of each image, in degrees.                                                        |
| `size-variance`   | `number`           | `0`     | Random size variation between images, from 0 to 1.                                            |
| `align-to-motion` | `boolean`          | `false` | Turns each image to face the direction the cursor is moving.                                  |
| `stack`           | `number`           | `0`     | Keeps this many of the newest images on screen in a pile instead of fading each. 0 turns off. |
| `tilt`            | `number`           | `0`     | Tilts images in 3D toward the edge where they appear, in degrees.                             |
| `class`           | `string`           | `''`    | Extra classes for the container.                                                              |

### Presets

| Preset  | Props                                                                                   |
| ------- | --------------------------------------------------------------------------------------- |
| Classic | defaults                                                                                |
| Pop     | `appear-scale: 0`, `zoom: 2.4`, `flash: 0.6`                                            |
| Drift   | `appear-scale: 0.1`, `align-to-motion`, `drift: 0.8`, `exit-scale: 1`, `lifetime: 0.6`  |
| Stack   | `stack: 7`, `rotation: 4`, `size-variance: 0.6`, `appear-scale: 0.7`, `exit-scale: 1.3` |

## Accessibility

- The images are decorative and use `pointer-events: none`, so they never block clicks on content underneath.
- With `prefers-reduced-motion: reduce` no images are spawned.
- The animation loop only runs while the pointer moves or images are still animating.

- Ported from [React Bits](https://reactbits.dev/animations/image-trail) by David Haz.
