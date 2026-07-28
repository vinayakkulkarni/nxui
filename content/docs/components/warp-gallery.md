---
title: Warp Gallery
description: An infinite image strip that bends like liquid glass under scroll velocity, with prismatic chromatic-aberration fringes.
---

::demo-warp-gallery
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/warp-gallery.json"
```

## Usage

```vue
<script setup lang="ts">
  import WarpGallery from '~/components/ui/warp-gallery/WarpGallery.vue';

  const items = [
    {
      image: '/covers/nothing.jpg',
      title: 'Nothing',
      subtitle: 'Phone (2a) Launch Microsite',
    },
    {
      image: '/covers/ferrari.jpg',
      title: 'Ferrari',
      subtitle: 'GT Apparel Capsule',
    },
  ];
</script>

<template>
  <WarpGallery :items="items" :bend="1" :aberration="1" class="h-120" />
</template>
```

Scroll or drag the strip. Velocity curls the cards away from the viewport
center, zooms the whole strip out mid-flight, and smears prismatic
blue/orange fringes into the bent planes — the faster you scroll, the harder
the warp. Cards near the center settle flat and clean; off-center cards keep
a gentle rest curl with rainbow dispersion at their rims. The strip wraps
around infinitely and snaps to the nearest card when the motion dies; the
title and `01/12` counter fade back in on settle and track the centered item
(`change` emits the active index).

## Props

| Prop          | Type                | Default    | Description                                        |
| ------------- | ------------------- | ---------- | -------------------------------------------------- |
| `items`       | `WarpGalleryItem[]` | 12 samples | Cards in the strip (`image`, `title`, `subtitle?`) |
| `bend`        | `number`            | `1`        | Rest curl of off-center cards (0 = flat)           |
| `aberration`  | `number`            | `1`        | Chromatic-aberration strength                      |
| `speed`       | `number`            | `1`        | Wheel / drag speed multiplier                      |
| `hideOverlay` | `boolean`           | `false`    | Hide the title, subtitle, and counter overlay      |

## Events

| Event    | Payload                                  | Description                          |
| -------- | ---------------------------------------- | ------------------------------------ |
| `change` | `(index: number, item: WarpGalleryItem)` | Fires when the centered item changes |

## Credits

Inspired by a gallery interaction by [Yousuf Soomro](https://x.com/yousufsoomrodev).
