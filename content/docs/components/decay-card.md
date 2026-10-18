---
title: Decay Card
description: An image card that tears and melts as the pointer moves, then pulls itself back together.
---

An image card drawn with a WebGL shader. Move the pointer fast and the photo tears apart at the edges; slow down and it pulls itself back together. The card drifts and tilts toward the pointer, and while nobody interacts its edges keep fraying slowly. With `scope="card"` it only reacts while hovered. Pick a preset in the panel to try the shatter, melt and prism looks.

::demo-decay-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/decay-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import DecayCard from '~/components/ui/decay-card/DecayCard.vue';
</script>

<template>
  <DecayCard
    image="https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop"
  >
    <p class="mb-1 text-xs text-white/70">No. 01</p>
    <p class="text-2xl/tight font-semibold tracking-tight">Afterglow</p>
  </DecayCard>

  <!-- Melting, with split colors, only reacting on hover -->
  <DecayCard
    image="/photo.jpg"
    :intensity="0.45"
    :grain="0.1"
    :detail="2"
    :flow="0.4"
    :chroma="0.6"
    :radius="16"
    scope="card"
  />
</template>
```

The image must be served with CORS headers (most image CDNs do), because it is uploaded to WebGL. If WebGL2 is not available or the image cannot be used, a plain `<img>` is shown instead.

## Props

| Prop          | Type                 | Default           | Description                                                                                |
| ------------- | -------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| `image`       | `string`             | An Unsplash photo | Image URL. It fills the card like a cover.                                                 |
| `width`       | `number`             | `300`             | Card width, in px.                                                                         |
| `height`      | `number`             | `400`             | Card height, in px.                                                                        |
| `intensity`   | `number`             | `0.5`             | How far the image tears apart at full decay, from 0 to 2. The edges tear the most.         |
| `sensitivity` | `number`             | `0.5`             | How little pointer movement it takes to reach full decay, from 0 to 1.                     |
| `hover-decay` | `number`             | `0.05`            | Decay that stays while the pointer rests on the card, from 0 to 1.                         |
| `recovery`    | `number`             | `0.6`             | Seconds the image takes to pull itself back together once the pointer slows down.          |
| `idle`        | `number`             | `0.35`            | Keeps the edges slowly fraying while nobody interacts, from 0 to 1.                        |
| `grain`       | `number`             | `0.25`            | Size of the tears, from broad melting shapes at 0 to fine shards at 1.                     |
| `detail`      | `number`             | `5`               | Layers of noise in the tears, from 1 to 8. More layers give rougher edges.                 |
| `pattern`     | `number`             | `4`               | Picks a different tear pattern.                                                            |
| `flow`        | `number`             | `0`               | Lets the tears churn while the card is decaying, from 0 to 2. 0 keeps them still.          |
| `chroma`      | `number`             | `0`               | Splits the color channels apart inside the tears, from 0 to 2.                             |
| `travel`      | `number`             | `50`              | How far in px the card drifts toward the pointer before it slows down.                     |
| `tilt`        | `number`             | `10`              | How far in degrees the card rotates as the pointer moves sideways.                         |
| `scope`       | `'window' \| 'card'` | `'window'`        | `window` follows the pointer anywhere on the page. `card` only reacts while it is hovered. |
| `radius`      | `number`             | `0`               | Corner radius of the image, in px.                                                         |
| `grayscale`   | `boolean`            | `false`           | Shows the image in grayscale.                                                              |
| `class`       | `string`             | `''`              | Extra classes on the root.                                                                 |

## Slots

| Slot      | Description                                                |
| --------- | ---------------------------------------------------------- |
| `default` | Content shown over the bottom of the image, in white text. |

## Accessibility

- The canvas is decorative (`aria-hidden`). Put any text that matters in the default slot, where it stays readable.
- With `prefers-reduced-motion: reduce`, the card does not drift, tilt or churn. The tears still follow the pointer speed.
- Rendering pauses while the card is off screen and once it has settled.

- Ported from [React Bits](https://reactbits.dev/components/decay-card) by David Haz.
