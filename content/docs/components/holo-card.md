---
title: Holo Card
description: Collectible trading card with a real holographic foil and glitter that sparkles as it tilts toward the light.
---

A trading card rendered through a WebGL2 shader: the print sits on a metal foil with one of eight holo patterns, and a glittering border catches the light. Move the pointer over the card to tilt it and steer the light; when nobody is hovering it drifts on its own. Give it a `back-image` and a click, Enter or Space flips it over.

::demo-holo-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/holo-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import HoloCard from '~/components/ui/holo-card/HoloCard.vue';
</script>

<template>
  <HoloCard
    image="/cards/pikachu.webp"
    back-image="/cards/back.webp"
    alt="Pikachu trading card"
    preset="bursts"
    foil-color="#e2e6ec"
    :intensity="0.85"
    :edge-sparkle="0.8"
    :frame="4"
    :tilt-max="14"
    :width="320"
  />
</template>
```

The image is uploaded as a WebGL texture, so it must be same-origin or served with CORS headers. The card height follows the image's aspect ratio.

## Props

| Prop           | Type                                                                                         | Default     | Description                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `image`        | `string`                                                                                     | —           | Front of the card. Same-origin or CORS-enabled URL.                                                                        |
| `back-image`   | `string`                                                                                     | —           | Back of the card. When set, a click or Enter flips the card over.                                                          |
| `alt`          | `string`                                                                                     | `''`        | Accessible description of the card.                                                                                        |
| `preset`       | `'bursts' \| 'stars' \| 'shards' \| 'cosmos' \| 'rainbow' \| 'swirl' \| 'glitter' \| 'gold'` | `'bursts'`  | The holo pattern. Bursts are rings of foil dashes, shards are cracked ice, swirl is one big round rainbow, gold is etched. |
| `foil-color`   | `string`                                                                                     | `'#e2e6ec'` | Colour of the metal under the print, silver by default.                                                                    |
| `intensity`    | `number`                                                                                     | `0.85`      | How strongly the foil shows through the print, from 0 for plain card to 1.                                                 |
| `scale`        | `number`                                                                                     | `1`         | Size of the holo pattern. Higher values pack in more, smaller elements.                                                    |
| `edge-sparkle` | `number`                                                                                     | `0.8`       | Brightness of the glitter on the silver border as it catches the light.                                                    |
| `frame`        | `number`                                                                                     | `4`         | Width of the sparkling border as a percentage of the card width. Match it to your card art.                                |
| `glare`        | `number`                                                                                     | `0.5`       | Strength of the glossy highlight under the light.                                                                          |
| `tilt-max`     | `number`                                                                                     | `14`        | Largest tilt in degrees as the pointer moves.                                                                              |
| `hover-scale`  | `number`                                                                                     | `1.04`      | How much the card lifts while hovered.                                                                                     |
| `radius`       | `number`                                                                                     | `14`        | Corner radius in px.                                                                                                       |
| `width`        | `number`                                                                                     | `320`       | Card width in px, capped at the parent. The height follows the image.                                                      |
| `idle`         | `boolean`                                                                                    | `true`      | Drifts the light and tilt slowly when nobody is hovering, so the foil keeps shimmering.                                    |
| `shadow`       | `boolean`                                                                                    | `true`      | Soft shadow under the card that follows the tilt.                                                                          |
| `class`        | `string`                                                                                     | `''`        | Extra classes for the root element.                                                                                        |

## Accessibility

- Without a back image the card is `role="img"` named by `alt`.
- With a back image it is a focusable `role="button"` with `aria-pressed` for the flipped state. Enter and Space flip it, and focus shows a visible ring.
- With `prefers-reduced-motion: reduce` the card stays flat: no tilt, no idle drift, and the flip jumps instead of turning.
- The render loop sleeps when the card is still or offscreen.

- Ported from [React Bits](https://reactbits.dev/components/holo-card) by David Haz.
