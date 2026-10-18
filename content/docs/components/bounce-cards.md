---
title: Bounce Cards
description: A fan of photo cards that bounce in, then spread apart and straighten the one you hover.
---

A loose fan of bordered photo cards that pop in one after another on springs. Hover a card and it straightens, lifts and grows while its neighbours slide away; move off and the fan settles back. Cards become buttons when you listen to `card-click`, and a click or Enter gives the card a little squash. Try the presets in the panel.

::demo-bounce-cards
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/bounce-cards.json"
```

## Usage

```vue
<script setup lang="ts">
  import BounceCards from '~/components/ui/bounce-cards/BounceCards.vue';

  const images = [
    '/photos/one.webp',
    { src: '/photos/two.webp', alt: 'Mountains at dusk' },
    '/photos/three.webp',
  ];

  function onCardClick(index: number) {
    console.log('clicked', index);
  }
</script>

<template>
  <BounceCards
    :images="images"
    :container-width="500"
    :container-height="320"
    :spread="85"
    :rotation="10"
    @card-click="onCardClick"
  />
</template>
```

Every card is one spring body (position, rotation, scale) stepped at 240 Hz on a single rAF loop that stops once everything rests, so hovering never flickers.

## Props

| Prop                | Type                                             | Default     | Description                                                                                     |
| ------------------- | ------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------- |
| `images`            | `Array<string \| { src: string; alt?: string }>` | `[]`        | Images for the cards, from left to right                                                        |
| `container-width`   | `number`                                         | `400`       | Width of the container in px                                                                    |
| `container-height`  | `number`                                         | `400`       | Height of the container in px                                                                   |
| `card-size`         | `number`                                         | `200`       | Width and height of each card in px                                                             |
| `spread`            | `number`                                         | `85`        | Horizontal distance between cards in px                                                         |
| `rotation`          | `number`                                         | `10`        | Largest tilt in degrees. Each card leans by a different share of it, like a loose pile          |
| `arc`               | `number`                                         | `0`         | Drops the outer cards by this many px so the fan curves. Negative values curve it up            |
| `push-distance`     | `number`                                         | `160`       | How far the other cards slide away from the hovered one, in px                                  |
| `hover-scale`       | `number`                                         | `1.06`      | Scale of the hovered card as it straightens and comes to the front                              |
| `bounciness`        | `number`                                         | `0.6`       | How much the cards overshoot as they pop in, 0–1                                                |
| `animation-delay`   | `number`                                         | `0.5`       | Seconds before the first card pops in                                                           |
| `animation-stagger` | `number`                                         | `0.06`      | Seconds between cards popping in                                                                |
| `enable-hover`      | `boolean`                                        | `true`      | Spreads the cards apart on hover                                                                |
| `border-width`      | `number`                                         | `5`         | Width of the card border in px                                                                  |
| `border-color`      | `string`                                         | `'#ffffff'` | Color of the card border                                                                        |
| `radius`            | `number`                                         | `25`        | Corner radius of the cards in px                                                                |
| `shadow`            | `boolean`                                        | `true`      | Soft drop shadow that deepens on hover                                                          |
| `transform-styles`  | `string[]`                                       | —           | Custom positions such as `'rotate(5deg) translate(-150px)'`. Overrides spread, rotation and arc |
| `class`             | `string`                                         | `''`        | Extra classes on the container                                                                  |

## Events

| Event        | Payload         | Description                                                                                |
| ------------ | --------------- | ------------------------------------------------------------------------------------------ |
| `card-click` | `index: number` | Card clicked or activated with Enter / Space. Binding it makes the cards focusable buttons |

## Accessibility

- With a `card-click` listener every card is a `role="button"` with `tabindex="0"`, a label from its `alt` text (or "Card N") and a visible focus ring. Focusing a card spreads the fan like a hover.
- Without a listener the cards are plain images and stay out of the tab order.
- With `prefers-reduced-motion: reduce` the cards appear at full size without popping and the springs are critically damped.
- `touch-action: pan-y` keeps vertical page scrolling working on touch screens.

- Ported from [React Bits](https://reactbits.dev/components/bounce-cards) by David Haz.
