---
title: Halftone Reveal
description: A halftone print of an image whose dots swell into the real photo under the cursor.
---

Prints an image as a halftone screen in mono, duotone or full color. Move the pointer over it and the dots swell into the real photo, leaving a trail that shrinks back into print. Click to send a ring of color out through the page.

::demo-halftone-reveal
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/halftone-reveal.json"
```

## Usage

```vue
<script setup lang="ts">
  import HalftoneReveal from '~/components/ui/halftone-reveal/HalftoneReveal.vue';
</script>

<template>
  <div class="relative h-150 w-full overflow-hidden">
    <HalftoneReveal
      src="/images/portrait.png"
      fit="contain"
      mode="duotone"
      shape="dot"
      :cell-size="7"
      :angle="22"
      ink-color="#2442ff"
      accent-color="#ff48a5"
      paper-color="#ffffff"
      :misregistration="0.4"
      :reveal-radius="160"
    />
  </div>
</template>
```

The image must be served with CORS headers. Transparent or plain backgrounds are detected and left unprinted. Set `paper-color` to your page background so the print sits on the page.

## Props

| Prop              | Type                                                               | Default                             | Description                                                                                             |
| ----------------- | ------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src`             | `string`                                                           | `'https://images.unsplash.com/...'` | Image to print. Transparent or plain backgrounds are left unprinted. Must be served with CORS headers.  |
| `fit`             | `'contain' \| 'cover'`                                             | `'cover'`                           | Show the whole image, or crop it to fill the container.                                                 |
| `mode`            | `'mono' \| 'duotone' \| 'color'`                                   | `'mono'`                            | One ink, two inks at different screen angles, or full color: CMYK on light paper and RGB on dark paper. |
| `shape`           | `'dot' \| 'ellipse' \| 'square' \| 'diamond' \| 'line' \| 'cross'` | `'dot'`                             | Shape of the halftone marks.                                                                            |
| `cell-size`       | `number`                                                           | `6`                                 | Spacing of the halftone screen, in px.                                                                  |
| `angle`           | `number`                                                           | `45`                                | Rotation of the screen, in degrees.                                                                     |
| `dot-scale`       | `number`                                                           | `1`                                 | Scales every mark. Below 1 keeps them apart, above 1 lets them merge sooner.                            |
| `ink-color`       | `string`                                                           | `'#120f17'`                         | Color of the printed marks.                                                                             |
| `accent-color`    | `string`                                                           | `'#ff4f2a'`                         | Second ink used in duotone mode.                                                                        |
| `paper-color`     | `string`                                                           | `'#ffffff'`                         | Background the image is printed on. Match it to your page.                                              |
| `contrast`        | `number`                                                           | `1.1`                               | Tonal contrast applied before printing.                                                                 |
| `brightness`      | `number`                                                           | `0`                                 | Shifts the image lighter or darker before printing.                                                     |
| `invert`          | `boolean`                                                          | `false`                             | Prints a negative of the image.                                                                         |
| `roughness`       | `number`                                                           | `0`                                 | Gives the marks ragged, ink-spread edges, from 0 to 1.                                                  |
| `misregistration` | `number`                                                           | `0`                                 | Offsets the ink layers like a slightly misaligned press, from 0 to 1.                                   |
| `reveal-radius`   | `number`                                                           | `160`                               | Radius of the area around the cursor where the dots swell into the real photo, in px.                   |
| `softness`        | `number`                                                           | `0.6`                               | Width of the band where the dots grow into the photo. 0 is a hard edge.                                 |
| `linger`          | `number`                                                           | `1.2`                               | Seconds the revealed trail takes to shrink back into print. 0 turns the trail off.                      |
| `reverse`         | `boolean`                                                          | `false`                             | Start as the photo and print wherever the cursor goes.                                                  |
| `wander`          | `boolean`                                                          | `false`                             | Lets the reveal drift around on its own while the pointer is away.                                      |
| `click-burst`     | `boolean`                                                          | `true`                              | Clicking sends a ring of color rippling out through the print.                                          |
| `intro`           | `boolean`                                                          | `true`                              | Grows the dots in from the center on load.                                                              |
| `class`           | `string`                                                           | `''`                                | Extra classes for the root element.                                                                     |
| `style`           | `StyleValue`                                                       | `undefined`                         | Inline styles for the root element.                                                                     |

## Accessibility

- The canvas is decorative and marked `aria-hidden`. If the image carries meaning, give the parent an `aria-label` or a visible caption.
- With `prefers-reduced-motion: reduce` the intro is skipped and `wander` is disabled. The reveal still follows the pointer.
- The render loop sleeps when idle, offscreen or in a hidden tab. GL resources are freed on unmount.
- Needs WebGL 2. Without it the container stays empty.

- Ported from [React Bits](https://reactbits.dev/animations/halftone-reveal) by David Haz.
