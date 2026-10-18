---
title: Scroll Stack
description: Cards pin and stack as you scroll, settling back into a dimmed deck with smooth, jitter-free motion.
---

A vertical list of cards that pin with native `position: sticky` as you scroll. Each new card slides over the last one, and the cards underneath shrink, darken and can blur, lean back or turn like a loose pile. Wheel scrolling glides smoothly and can snap the nearest card onto the stack. Scroll inside the panel, then try the presets.

::demo-scroll-stack
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-stack.json"
```

## Usage

```vue
<script setup lang="ts">
  import ScrollStack from '~/components/ui/scroll-stack/ScrollStack.vue';
  import ScrollStackItem from '~/components/ui/scroll-stack/ScrollStackItem.vue';

  function onStackComplete() {
    console.log('stacked');
  }
</script>

<template>
  <div class="h-125">
    <ScrollStack
      :item-distance="40"
      :item-stack-distance="22"
      stack-position="12%"
      :dim-amount="0.25"
      @stack-complete="onStackComplete"
    >
      <ScrollStackItem>
        <h2 class="text-2xl font-semibold">Card one</h2>
      </ScrollStackItem>
      <ScrollStackItem>
        <h2 class="text-2xl font-semibold">Card two</h2>
      </ScrollStackItem>
      <ScrollStackItem class="h-75 bg-transparent p-0">
        <img
          src="/photo.webp"
          alt=""
          class="absolute inset-0 size-full rounded-[inherit] object-cover"
        />
      </ScrollStackItem>
    </ScrollStack>
  </div>
</template>
```

By default the stack scrolls inside its own container, so give it a height. With `use-window-scroll` the cards pin as the page scrolls instead; then no parent may use `overflow: hidden`, or the cards cannot stick.

## Props

### ScrollStack

| Prop                  | Type               | Default | Description                                                                                      |
| --------------------- | ------------------ | ------- | ------------------------------------------------------------------------------------------------ |
| `item-distance`       | `number`           | `100`   | Gap between cards before they stack, in px. Larger gaps mean more scrolling between cards        |
| `item-stack-distance` | `number`           | `24`    | How far each card rests below the one before it in the stack, in px. `0` piles them exactly      |
| `stack-position`      | `number \| string` | `'15%'` | Where the stack pins, from the top of the viewport or container. A number is px, or a `%` string |
| `item-scale`          | `number`           | `0.05`  | How much a card shrinks for each card stacked on top of it                                       |
| `base-scale`          | `number`           | `0.8`   | The smallest a buried card can shrink to                                                         |
| `dim-amount`          | `number`           | `0.2`   | How much a card darkens for each card stacked on top of it, 0–1                                  |
| `blur-amount`         | `number`           | `0`     | Blur added for each card stacked on top, in px                                                   |
| `tilt-amount`         | `number`           | `0`     | How far buried cards lean back in 3D, in degrees                                                 |
| `rotation-amount`     | `number`           | `0`     | How far buried cards turn, alternating left and right like a loose pile, in degrees              |
| `hold-distance`       | `number`           | `200`   | How long the finished stack stays pinned before it scrolls away, in px of scrolling              |
| `smooth-scroll`       | `boolean`          | `true`  | Glides mouse wheel scrolling. Touch, keyboard and scrollbar scrolling stay native                |
| `snap`                | `boolean`          | `false` | When scrolling stops near a card, glides it the rest of the way onto the stack                   |
| `use-window-scroll`   | `boolean`          | `false` | Stacks the cards as the page scrolls instead of inside its own container                         |
| `class`               | `string`           | `''`    | Extra classes on the stack container                                                             |

### ScrollStackItem

| Prop    | Type     | Default | Description                                              |
| ------- | -------- | ------- | -------------------------------------------------------- |
| `class` | `string` | `''`    | Extra classes for the card: its size, colors and padding |

## Events

| Event            | Payload | Description                                   |
| ---------------- | ------- | --------------------------------------------- |
| `stack-complete` | —       | Emitted when the last card lands on the stack |

## Slots

| Slot                        | Description                                   |
| --------------------------- | --------------------------------------------- |
| `default` (ScrollStack)     | The cards, usually `ScrollStackItem` elements |
| `default` (ScrollStackItem) | Card content                                  |

## Accessibility

- Pinning uses native `position: sticky`, so keyboard, touch and scrollbar scrolling all work and never jitter.
- Only mouse wheel input is smoothed; it falls back to native scrolling inside nested scrollers and at either end of the stack.
- With `prefers-reduced-motion: reduce` wheel smoothing and snap gliding jump straight to the target.
- The dim layer on each card is `aria-hidden` and does not catch pointer events.

- Ported from [React Bits](https://reactbits.dev/components/scroll-stack) by David Haz.
