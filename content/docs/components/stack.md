---
title: Stack
description: Pile of cards you can drag, flick or click through, with thrown cards tucking underneath.
---

A pile of cards in one of four layouts. Drag the top card past the threshold, or flick it, and it flies off with your momentum, then tucks in at the back once it clears the pile. While held it leans in 3D around the point you grabbed. Focus the stack and press Enter, Space, → or ↓ to cycle with the keyboard.

::demo-stack
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/stack.json"
```

## Usage

```vue
<script setup lang="ts">
  import Stack from '~/components/ui/stack/Stack.vue';

  const images = [
    'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
    'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
  ];
</script>

<template>
  <!-- The stack fills its parent, so give the parent a size. -->
  <div class="size-57.5">
    <Stack
      :cards="images"
      layout="pile"
      :frame="8"
      @change="(index) => console.log(index)"
    />
  </div>
</template>
```

Any content works as a card: put elements in the default slot, one per card, top first. Images fill the card automatically.

```vue
<Stack layout="deck">
  <div class="grid size-full place-items-center bg-card text-2xl">1</div>
  <div class="grid size-full place-items-center bg-muted text-2xl">2</div>
  <div class="grid size-full place-items-center bg-accent text-2xl">3</div>
</Stack>
```

## Props

| Prop                    | Type                                     | Default            | Description                                                                                                                         |
| ----------------------- | ---------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `cards`                 | `string[]`                               | four sample photos | Image URLs for the cards, top first. Ignored when the default slot has content.                                                     |
| `layout`                | `'fan' \| 'cascade' \| 'deck' \| 'pile'` | `'fan'`            | How the cards behind sit: fanned from a corner, offset diagonally, stacked upward or scattered like loose photos.                   |
| `visible`               | `number`                                 | `4`                | How many cards show, counting the top one. The rest wait hidden at the back.                                                        |
| `spread`                | `number`                                 | `0.5`              | How far the cards behind fan, offset or scatter, from 0 for a neat stack to 1 for a wide one.                                       |
| `depth`                 | `number`                                 | `0.5`              | How much smaller and darker each card behind gets, from 0 to 1.                                                                     |
| `radius`                | `number`                                 | `16`               | Corner radius of the cards in px.                                                                                                   |
| `frame`                 | `number`                                 | `0`                | Width of a border around each card in px, like the edge of a printed photo.                                                         |
| `frame-color`           | `string`                                 | `'#ffffff'`        | Color of the frame.                                                                                                                 |
| `shadow`                | `boolean`                                | `true`             | Gives every card a soft drop shadow.                                                                                                |
| `tilt`                  | `number`                                 | `30`               | How far the top card leans in 3D while dragged, in degrees. It tilts around the point you hold and leans into fast moves. 0 = flat. |
| `threshold`             | `number`                                 | `90`               | How far in px the top card has to be dragged before it goes to the back. A quick flick works too.                                   |
| `speed`                 | `number`                                 | `1`                | Speed of every animation, from 0.5 (slow, soft) to 2 (fast, snappy).                                                                |
| `send-to-back-on-click` | `boolean`                                | `false`            | Clicking the top card also sends it to the back.                                                                                    |
| `autoplay`              | `boolean`                                | `false`            | Cycles through the cards on its own.                                                                                                |
| `autoplay-delay`        | `number`                                 | `3000`             | Time in ms between automatic cycles.                                                                                                |
| `pause-on-hover`        | `boolean`                                | `false`            | Pauses autoplay while the pointer is over the stack.                                                                                |
| `class`                 | `string`                                 | `''`               | Extra classes for the root element.                                                                                                 |

## Events

| Event    | Payload         | Description                                                |
| -------- | --------------- | ---------------------------------------------------------- |
| `change` | `index: number` | Index of the new top card, fired whenever the stack moves. |

## Slots

| Slot      | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `default` | One element per card, top first. Replaces `cards` when present. |

## Accessibility

- The stack is a focusable `group` labelled "Card stack"; Enter, Space, → and ↓ send the top card to the back.
- Focus shows a ring around the top card. Cards behind the top one are `aria-hidden`.
- With `prefers-reduced-motion: reduce` cards swap with a short fade instead of flying, and the 3D lean is off.

- Ported from [React Bits](https://reactbits.dev/components/stack) by David Haz.
