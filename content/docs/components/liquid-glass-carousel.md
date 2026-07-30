---
title: Liquid Glass Carousel
description: An infinite scroll-driven portfolio carousel rendered through a liquid-glass lens — chromatic dispersion, a shimmering ring and a fluid rim, as a single fullscreen post-process.
---

::demo-liquid-glass-carousel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/liquid-glass-carousel.json"
```

## Usage

```vue
<script setup lang="ts">
  import LiquidGlassCarousel from '~/components/ui/liquid-glass-carousel/LiquidGlassCarousel.vue';

  const items = [
    { src: '/img1.png', brand: 'Nothing', desc: 'Phone (2a) Launch Microsite' },
    {
      src: '/img2.png',
      brand: 'Apple',
      desc: '330 P4 Experience Page Concept',
    },
  ];
</script>

<template>
  <LiquidGlassCarousel :items="items" class="h-screen" />
</template>
```

Scroll to glide the row: the wheel moves a target and the scroll lerps after
it, so the row drifts like it's being dragged through honey. When the wheel
goes quiet and the glide is nearly done, the target is redirected once onto
the nearest panel center — the landing is part of the same glide, never a
click into place. Panels compress up to 25% at high scroll speed.

Click an image to focus it: the row centers that panel, every other panel
sweeps down out of view in a center-out wave, the lens distortion melts away
and the image enlarges. Click **Close** to play it backwards, edges first.

On load, panels rise from below at a small size, hold, then bloom to full
size while the lens fades back in.

## How it works

Every panel is a plane mesh under an orthographic camera set up so
**1 world unit = 1 pixel**, which makes all the layout math plain pixels.
Panels share a fixed height and take their width from each image's own aspect
ratio, so nothing is cropped or stretched. A pool of four copies of the full
set is repositioned every frame and wrapped with a modulo, so the row is
infinite in both directions without ever creating or destroying a mesh.

The glass look is a two-pass render: the whole row goes into an offscreen
framebuffer at device resolution, then a fullscreen quad draws that buffer
through the lens shader. Inside the lens region the UVs are pulled inward,
the rim gets chromatic dispersion by sampling the texture 16 times along a
small offset weighted red-to-blue, plus a white nova at the center, a
shimmering blue ring, a bright border line and a sine-based fluid wave that
wobbles the rim.

## Props

| Prop               | Type                                 | Default    | Description                                             |
| ------------------ | ------------------------------------ | ---------- | ------------------------------------------------------- |
| `items`            | `LiquidGlassCarouselItem[]`          | 12 samples | Panels — `src`, `brand`, `desc`, optional `aspect`      |
| `config`           | `Partial<LiquidGlassCarouselConfig>` | `{}`       | Layout + scroll feel (`panelH`, `gap`, `ease`, `snap`…) |
| `lens`             | `Partial<LiquidGlassLensConfig>`     | `{}`       | Every lens knob (`dispersion`, `blueRing`, `rimStart`…) |
| `focus`            | `Partial<LiquidGlassFocusConfig>`    | `{}`       | Focus choreography (durations, stagger, `centerScale`)  |
| `entry`            | `Partial<LiquidGlassEntryConfig>`    | `{}`       | Entry choreography (`enabled`, `startH`, staggers…)     |
| `minViewportWidth` | `number`                             | `1025`     | Below this width a notice replaces the carousel         |

## Events

| Event          | Payload           | Description                 |
| -------------- | ----------------- | --------------------------- |
| `change`       | `(index: number)` | The centered image changed  |
| `focus-change` | `(open: boolean)` | Focus mode opened or closed |
| `entry-done`   | `(done: boolean)` | The entry animation settled |

## Exposed methods

| Method          | Description                 |
| --------------- | --------------------------- |
| `closeFocus()`  | Close an open focus session |
| `replayEntry()` | Replay the entry animation  |

## Credits

Ported from [liquid-glass-carousel](https://github.com/Yousuf-developer/liquid-glass-carousel)
by [Yousuf Soomro](https://github.com/Yousuf-developer) (MIT). The original is
three.js + GSAP; this port keeps the engine and shader intact and swaps GSAP
for `motion-v` as the number-tweener.
