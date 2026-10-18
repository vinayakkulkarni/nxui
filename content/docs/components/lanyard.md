---
title: Lanyard
description: Swinging 3D badge on a stretchy woven band that you can drag, throw or click to flip.
---

A three.js ID badge hanging from a woven strap. The band stretches and snaps back, a light breeze keeps it moving, and the card has real momentum. Drag it to stretch and throw it, or click it to flip it over. Pass any image for the front, back and band; no models or setup are needed.

::demo-lanyard
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/lanyard.json"
```

## Usage

```vue
<script setup lang="ts">
  import Lanyard from '~/components/ui/lanyard/Lanyard.vue';
</script>

<template>
  <div class="relative h-125 w-full">
    <Lanyard
      front-image="/badge-front.webp"
      back-image="/badge-back.webp"
      strap-image="/band.png"
      finish="holographic"
      metal="gold"
      :strap-length="0.5"
    />
  </div>
</template>
```

The component fills its parent, so give the parent a height. Images load with `crossOrigin="anonymous"`; remote images must send CORS headers.

## Props

| Prop            | Type                                                 | Default      | Description                                                                                               |
| --------------- | ---------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `front-image`   | `string`                                             | `undefined`  | Image URL printed on the front of the card. Any size or aspect works.                                     |
| `back-image`    | `string`                                             | `undefined`  | Image URL printed on the back. Falls back to `front-image`, then to a blank card.                         |
| `image-fit`     | `'cover' \| 'contain'`                               | `'cover'`    | Cover fills and crops; contain fits inside on the card colour.                                            |
| `card-color`    | `string`                                             | `'#ffffff'`  | Colour of the card, shown when there is no image and around contained images.                             |
| `orientation`   | `'portrait' \| 'landscape'`                          | `'portrait'` | Whether the card hangs tall or wide.                                                                      |
| `finish`        | `'glossy' \| 'matte' \| 'holographic' \| 'metallic'` | `'glossy'`   | Card surface. Holographic adds a sparkling foil that shifts as the card turns; metallic a brushed sheen.  |
| `corner-radius` | `number`                                             | `0.3`        | Corner roundness, from 0 (square) to 1 (very round).                                                      |
| `size`          | `number`                                             | `0.6`        | Card height as a fraction of the container height.                                                        |
| `anchor`        | `'left' \| 'center' \| 'right'`                      | `'center'`   | Where the band hangs from along the top edge.                                                             |
| `strap-length`  | `number`                                             | `0.5`        | How far below the top edge the card hangs, from 0 (short) to 1 (long).                                    |
| `strap-image`   | `string`                                             | `undefined`  | Image URL printed along the band. A wide image repeats along its length; its height spans the band width. |
| `strap-color`   | `string`                                             | `'#111111'`  | Band colour when there is no strap image.                                                                 |
| `strap-width`   | `number`                                             | `0.65`       | Band width relative to its default, from 0.4 to 2.                                                        |
| `metal`         | `'graphite' \| 'silver' \| 'gold'`                   | `'silver'`   | Finish of the clamp and the ring that holds the card.                                                     |
| `gravity`       | `number`                                             | `1`          | How strongly the card falls. Lower values float and swing slowly; 0 turns gravity off.                    |
| `damping`       | `number`                                             | `0.5`        | How quickly the swing dies down, from 0 (long sway) to 1 (quick settle).                                  |
| `elasticity`    | `number`                                             | `0.5`        | How hard the band snaps the card back after it is stretched.                                              |
| `breeze`        | `number`                                             | `0.5`        | A gentle, changing wind that keeps the card moving when nobody touches it.                                |
| `interactive`   | `boolean`                                            | `true`       | Lets visitors drag, stretch and throw the card, and click it to flip it.                                  |
| `intro`         | `boolean`                                            | `true`       | On mount the card drops in from the side and swings into place.                                           |
| `class`         | `string`                                             | `''`         | Extra classes for the root element.                                                                       |

## Accessibility

- The canvas is decorative (`aria-hidden`); put any information printed on the badge in the page text as well.
- With `prefers-reduced-motion: reduce` the intro drop and the breeze are off, so the card only moves when dragged.
- On touch screens the page still scrolls vertically unless the drag starts on the card.
- Rendering pauses while the component is off screen and once the card comes to rest with no breeze.

## Credits

- Ported from [React Bits](https://reactbits.dev/components/lanyard) by David Haz.
