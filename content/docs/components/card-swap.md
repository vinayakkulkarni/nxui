---
title: Card Swap
description: A 3D stack of cards that sends the front card to the back on a timer, or when you fling it.
---

A 3D stack of cards. On a timer the front card drops away and lands at the back, with a spring that overshoots. Drag or fling the front card in any direction to send it back yourself, click a card behind to bring it forward, or use the arrow keys. The stack shifts in depth with the cursor and fans out while hovered.

::demo-card-swap
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/card-swap.json"
```

## Usage

```vue
<script setup lang="ts">
  import { CardSwap } from '~/components/ui/card-swap';
  import type { CardSwapItem } from '~/components/ui/card-swap';

  const items: CardSwapItem[] = [
    { title: 'Golden hour', image: '/sunset.jpg', icon: 'lucide:sunset' },
    { title: 'Black beach', image: '/beach.jpg', icon: 'lucide:tree-palm' },
    { title: 'Steel arches', image: '/bridge.jpg', icon: 'lucide:bridge' },
  ];

  function onChange(index: number) {
    console.log('front card', index);
  }
</script>

<template>
  <div class="relative h-150 w-full">
    <CardSwap :items="items" theme="dark" @change="onChange" />
  </div>
</template>
```

Pass your own cards through the default slot. Wrap each one in `CardSwapCard` to get the matching tile style:

```vue
<CardSwap :width="400" :height="300">
  <CardSwapCard>Your content</CardSwapCard>
  <CardSwapCard>More content</CardSwapCard>
  <CardSwapCard>Even more</CardSwapCard>
</CardSwap>
```

The stack scales down to fit its container, so give the parent a real height.

## Props

| Prop                | Type                | Default      | Description                                                                                   |
| ------------------- | ------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `items`             | `CardSwapItem[]`    | Sample cards | Cards to show when no slot content is passed. `title`, `image`, `icon` (Iconify name), `alt`. |
| `width`             | `number`            | `460`        | Width of each card, in px.                                                                    |
| `height`            | `number`            | `340`        | Height of each card, in px.                                                                   |
| `card-distance`     | `number`            | `60`         | Horizontal step between stacked cards, in px.                                                 |
| `vertical-distance` | `number`            | `70`         | Vertical step between stacked cards, in px.                                                   |
| `depth`             | `number`            | `90`         | How far back each card sits, in px. More depth makes cards smaller.                           |
| `skew-amount`       | `number`            | `6`          | Slant of the cards, in degrees.                                                               |
| `visible-cards`     | `number`            | `4`          | How many cards show. Extra cards wait hidden at the back.                                     |
| `delay`             | `number`            | `4000`       | Time between swaps, in ms.                                                                    |
| `autoplay`          | `boolean`           | `true`       | Sends the front card to the back on a timer.                                                  |
| `pause-on-hover`    | `boolean`           | `true`       | Pauses the timer while the cursor is over a card.                                             |
| `draggable`         | `boolean`           | `true`       | Lets people drag or fling the front card to the back.                                         |
| `speed`             | `number`            | `1`          | Speed of the swap animation.                                                                  |
| `bounce`            | `number`            | `0.35`       | How much the cards overshoot as they settle, from 0 to 1.                                     |
| `parallax`          | `number`            | `0.5`        | How much the stack shifts in depth with the cursor, from 0 to 1.                              |
| `hover-spread`      | `number`            | `0.12`       | How much the stack fans out while hovered.                                                    |
| `dim`               | `number`            | `0.5`        | How much the cards behind fade back, from 0 to 1.                                             |
| `card-radius`       | `number`            | `18`         | Corner radius of the cards, in px.                                                            |
| `intro`             | `boolean`           | `true`       | Fans the cards out from the front one on mount.                                               |
| `theme`             | `'dark' \| 'light'` | `'dark'`     | Color theme of the cards.                                                                     |
| `class`             | `string`            | `''`         | Extra classes for the container.                                                              |

## Events

| Event        | Payload         | Description                                                        |
| ------------ | --------------- | ------------------------------------------------------------------ |
| `change`     | `index: number` | Index of the new front card after each swap.                       |
| `card-click` | `index: number` | A card was clicked. Clicking a card behind also brings it forward. |

## Slots / Exposed

| API       | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `default` | Your own cards. Wrap each in `CardSwapCard` for the tile style. |
| `next()`  | Template ref method. Sends the front card to the back.          |
| `prev()`  | Template ref method. Brings the back card to the front.         |

## Accessibility

- The stack is a focusable `region` with `aria-roledescription="carousel"`. Arrow Right / Down swap forward, Arrow Left / Up swap back. The front card shows a focus ring when the stack has keyboard focus.
- The timer pauses while the stack is offscreen, while the tab is hidden, and (by default) while the cursor is over a card.
- With `prefers-reduced-motion: reduce`, the springs are critically damped (no overshoot), the intro, parallax and hover fan-out are off.

- Ported from [React Bits](https://reactbits.dev/components/card-swap) by David Haz.
