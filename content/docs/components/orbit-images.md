---
title: Orbit Images
description: Photos that travel along an SVG path with real depth, passing behind and in front of center content. Drag to spin, click to bring one forward.
---

Images ride an SVG path (ellipse, circle, star, heart, infinity, wave or your own) and scale to fit any container. With depth, photos at the back shrink, dim and pass behind the center content, while photos at the front grow and pass in front of it. Drag or swipe sideways to spin and fling the orbit, hover to slow it down, and click a photo to glide it to the front.

::demo-orbit-images
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/orbit-images.json"
```

## Usage

```vue
<script setup lang="ts">
  import OrbitImages from '~/components/ui/orbit-images/OrbitImages.vue';

  const images = [
    'https://picsum.photos/300/300?grayscale&random=1',
    'https://picsum.photos/300/300?grayscale&random=2',
    { src: 'https://picsum.photos/300/300?grayscale&random=3', alt: 'Bridge' },
  ];

  function onItemClick(index: number, src: string) {
    console.log(index, src);
  }
</script>

<template>
  <div class="h-115 w-full">
    <OrbitImages
      :images="images"
      :radius-x="340"
      :radius-y="80"
      :item-size="90"
      :depth="0.6"
      show-path
      height="100%"
      @item-click="onItemClick"
    >
      <span class="text-4xl font-semibold">Moments</span>
    </OrbitImages>
  </div>
</template>
```

The default slot is the center content. With `depth` above 0 the images pass behind and in front of it, and the front half of the path line is drawn over it.

## Props

| Prop               | Type                                                                                                                      | Default                    | Description                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `images`           | `Array<string \| { src: string; alt?: string }>`                                                                          | `[]`                       | Images that travel along the path, as URLs or objects with their own alt text.                              |
| `alt-prefix`       | `string`                                                                                                                  | `'Orbiting image'`         | Prefix for the alt text of images given as plain URLs.                                                      |
| `shape`            | `'ellipse' \| 'circle' \| 'square' \| 'rectangle' \| 'triangle' \| 'star' \| 'heart' \| 'infinity' \| 'wave' \| 'custom'` | `'ellipse'`                | Shape of the path the images follow.                                                                        |
| `custom-path`      | `string`                                                                                                                  | `undefined`                | Your own SVG path, drawn in a `base-width` by `base-width` space. Used when `shape` is `custom`.            |
| `base-width`       | `number`                                                                                                                  | `1400`                     | Size of the coordinate space for the radii, the item size and custom paths.                                 |
| `radius-x`         | `number`                                                                                                                  | `700`                      | Horizontal radius for the ellipse, rectangle, infinity and wave.                                            |
| `radius-y`         | `number`                                                                                                                  | `170`                      | Vertical radius for the ellipse, rectangle, infinity and wave.                                              |
| `radius`           | `number`                                                                                                                  | `300`                      | Radius for the circle, square, triangle, star and heart.                                                    |
| `star-points`      | `number`                                                                                                                  | `5`                        | Number of points on the star.                                                                               |
| `star-inner-ratio` | `number`                                                                                                                  | `0.5`                      | Inner radius of the star as a fraction of the outer one.                                                    |
| `rotation`         | `number`                                                                                                                  | `-8`                       | Rotation of the whole path in degrees. Images stay upright.                                                 |
| `duration`         | `number`                                                                                                                  | `40`                       | Seconds for one full lap.                                                                                   |
| `item-size`        | `number`                                                                                                                  | `64`                       | Size of each image, in the same units as the radii.                                                         |
| `direction`        | `'normal' \| 'reverse'`                                                                                                   | `'normal'`                 | Which way the images travel.                                                                                |
| `fill`             | `boolean`                                                                                                                 | `true`                     | Spreads the images evenly around the path. Turn it off to make them follow each other in a train.           |
| `depth`            | `number`                                                                                                                  | `0.5`                      | Sense of depth, from 0 to 1. Back images get smaller, dimmer and pass behind the center content.            |
| `align-to-path`    | `boolean`                                                                                                                 | `false`                    | Turns each image to follow the curve instead of staying upright.                                            |
| `item-radius`      | `number \| string`                                                                                                        | `12`                       | Corner radius in `item-size` units, or any CSS length. Half of `item-size` makes circles.                   |
| `shadow`           | `number`                                                                                                                  | `0.3`                      | Strength of the soft shadow under each image, from 0 to 1.                                                  |
| `hover-scale`      | `number`                                                                                                                  | `1.08`                     | How much an image grows when hovered.                                                                       |
| `hover-speed`      | `number`                                                                                                                  | `0.3`                      | Speed while the orbit is hovered, as a fraction of the normal speed. 0 pauses it, 1 keeps full speed.       |
| `draggable`        | `boolean`                                                                                                                 | `true`                     | Lets people drag or swipe sideways to spin the orbit, and fling it.                                         |
| `click-to-front`   | `boolean`                                                                                                                 | `true`                     | Clicking an image glides it around to the front.                                                            |
| `show-path`        | `boolean`                                                                                                                 | `false`                    | Draws the path the images follow.                                                                           |
| `path-color`       | `string`                                                                                                                  | `'rgba(128,128,128,0.35)'` | Color of the path line.                                                                                     |
| `path-width`       | `number`                                                                                                                  | `2`                        | Width of the path line in pixels.                                                                           |
| `path-dash`        | `number`                                                                                                                  | `0`                        | Dash length of the path line in pixels. 0 draws a solid line.                                               |
| `easing`           | `'linear' \| 'easeIn' \| 'easeOut' \| 'easeInOut'`                                                                        | `'linear'`                 | Easing applied to each lap.                                                                                 |
| `paused`           | `boolean`                                                                                                                 | `false`                    | Stops the orbit. Dragging still works.                                                                      |
| `intro`            | `boolean`                                                                                                                 | `true`                     | Images fan out from the front around the path, and the line draws in, when the orbit first comes into view. |
| `width`            | `number \| string`                                                                                                        | `'100%'`                   | Width of the container. The orbit scales to fit.                                                            |
| `height`           | `number \| string`                                                                                                        | `'auto'`                   | Height of the container. `auto` matches the shape of the orbit, any other value fits the orbit inside.      |
| `class`            | `string`                                                                                                                  | `''`                       | Extra classes for the container.                                                                            |

## Events

| Event        | Payload                        | Description                                                                               |
| ------------ | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `item-click` | `(index: number, src: string)` | Fired when an image is clicked. When bound, the images become keyboard-focusable buttons. |

## Slots

| Slot      | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| `default` | Center content. With `depth`, images pass behind and in front of it. |

## Accessibility

- Without an `item-click` listener the orbit is decorative and marked `aria-hidden`.
- With `item-click`, every image is a `role="button"` with `tabindex="0"` and its alt text as label. Enter or Space activates it, and keyboard focus glides the image to the front with a visible focus ring.
- With `prefers-reduced-motion: reduce` the orbit stays still and the intro is skipped. Dragging still works.
- The loop sleeps while the orbit is offscreen.

- Ported from [React Bits](https://reactbits.dev/animations/orbit-images) by David Haz.
