---
title: Morph Slider
description: WebGL image slider that melts, ripples, shears or swirls between slides with a GPU displacement transition.
---

# Morph Slider

An image slider drawn on one WebGL canvas. Each change of slide blends the two images through a displacement shader, with a short RGB split at the midpoint and a slow idle drift on the shown image. Use the arrows, the dots or the Left/Right keys, or drag the image sideways to scrub the morph by hand. Release past 40% to finish the change, or earlier to snap back.

::demo-morph-slider
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/morph-slider.json"
```

## Usage

```vue
<script setup lang="ts">
  import MorphSlider from '~/components/ui/morph-slider/MorphSlider.vue';
  import type { MorphItem } from '~/components/ui/morph-slider/types';

  const items: MorphItem[] = [
    { image: '/slides/one.jpg', caption: 'One' },
    { image: '/slides/two.jpg', caption: 'Two' },
    { image: '/slides/three.jpg', caption: 'Three' },
  ];
</script>

<template>
  <div class="h-125 w-full">
    <MorphSlider
      :items="items"
      transition="ripple"
      ease="power2.inOut"
      :duration="1.1"
      :intensity="0.55"
      autoplay
    />
  </div>
</template>
```

Images load with `crossOrigin = 'anonymous'`, so remote hosts must send CORS headers. A dark placeholder shows until each image loads.

## Props

| Prop              | Type                                       | Default          | Description                                                                                       |
| ----------------- | ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------- |
| `items`           | `MorphItem[]` (`{ image; caption? }`)      | 4 Unsplash shots | Slides to morph between.                                                                          |
| `start-index`     | `number`                                   | `0`              | Slide shown on mount.                                                                             |
| `transition`      | `'melt' \| 'ripple' \| 'shear' \| 'swirl'` | `'melt'`         | Character of the displacement morph. Ripple starts at the last pointer-down point.                |
| `duration`        | `number`                                   | `1.1`            | Length of a full transition in seconds.                                                           |
| `ease`            | `string`                                   | `'power2.inOut'` | GSAP-style ease name (`power1`–`power4`, `sine`, `expo`, `circ`, `none` + `.in`/`.out`/`.inOut`). |
| `intensity`       | `number`                                   | `0.55`           | How far the images warp during the morph.                                                         |
| `scale`           | `number`                                   | `2.4`            | Frequency of the noise field (affects Melt most).                                                 |
| `aberration`      | `number`                                   | `0.35`           | RGB split that peaks mid-transition.                                                              |
| `drift`           | `number`                                   | `0.4`            | Idle drift and breathing on the shown image.                                                      |
| `autoplay`        | `boolean`                                  | `false`          | Advance automatically; pauses while hovered.                                                      |
| `autoplay-delay`  | `number`                                   | `4`              | Seconds each slide holds before autoplay advances (minimum 1).                                    |
| `loop`            | `boolean`                                  | `true`           | Wrap from the last slide back to the first.                                                       |
| `radius`          | `number`                                   | `16`             | Corner radius in pixels.                                                                          |
| `overlay-color`   | `string`                                   | `'#000000'`      | Tint of the edge vignette.                                                                        |
| `show-captions`   | `boolean`                                  | `true`           | Show captions that blur in with each slide.                                                       |
| `show-controls`   | `boolean`                                  | `true`           | Show the previous and next buttons.                                                               |
| `show-indicators` | `boolean`                                  | `true`           | Show the slide dots.                                                                              |
| `class`           | `string`                                   | `''`             | Extra classes for the root element.                                                               |

## Accessibility

- The stage is focusable (`role="group"`, `aria-roledescription="carousel"`). Left and Right arrow keys change slides.
- The arrow buttons have labels. The dots use `role="tab"` with `aria-selected`.
- The caption region uses `aria-live="polite"`, so slide changes are announced.
- With `prefers-reduced-motion: reduce`, the displacement and RGB split are off, transitions cap at 0.4 s, and caption and dot transitions are instant.
- The render loop pauses when the slider leaves the viewport.

- Ported from [React Bits](https://reactbits.dev/components/morph-slider) by David Haz.
