---
title: Rubber Segment
description: Segmented control whose rubber thumb stretches across the gap and squashes into place.
---

A segmented control with a rubber thumb. Tap a slot and the thumb dilates across the old and new slot, then contracts and squashes into place. Grab the active slot to drag the thumb, rubber-band it past the ends, or flick it to glide to a far slot. Arrow keys, Home and End move the selection.

::demo-rubber-segment
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/rubber-segment.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import RubberSegment from '~/components/ui/rubber-segment/RubberSegment.vue';

  const period = ref('Week');
</script>

<template>
  <RubberSegment
    v-model="period"
    :items="[
      'Day',
      'Week',
      { value: 'month', label: 'Month', icon: 'lucide:calendar' },
    ]"
    :stretch="100"
    :squash="3"
    @change="(value) => console.log(value)"
  />
</template>
```

The thumb is one element clipped with `clip-path: inset(...)`. Its left and right edges are two independent springs, so the leading edge can arrive before the trailing edge. The labels inside the thumb are a copy of the track labels, so the active label color is revealed exactly where the thumb is.

## Props

| Prop                | Type                                                            | Default               | Description                                                                       |
| ------------------- | --------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `items`             | `(string \| { value: string; label: string; icon?: string })[]` | —                     | The slots, in order. A string is both value and label. `icon` is an Iconify name. |
| `model-value`       | `string`                                                        | `undefined`           | Controlled value (`v-model`). A change from outside jumps the thumb.              |
| `default-value`     | `string`                                                        | first item            | Initial value when uncontrolled.                                                  |
| `track-color`       | `string`                                                        | `'#27272a'`           | The well behind the slots.                                                        |
| `thumb-color`       | `string`                                                        | `'#fafafa'`           | The rubber thumb, and the focus ring.                                             |
| `text-color`        | `string`                                                        | `'#fafafa'`           | Idle labels, drawn at 70%.                                                        |
| `active-text-color` | `string`                                                        | `'#18181b'`           | The label revealed inside the thumb.                                              |
| `size`              | `'sm' \| 'md' \| 'lg'`                                          | `'md'`                | Track height 28, 36 or 44 px; font and padding follow.                            |
| `radius`            | `number`                                                        | `10`                  | Track corner radius in px.                                                        |
| `inset`             | `number`                                                        | `3`                   | Gap between thumb and track edge. The thumb corner is radius minus inset.         |
| `equal-slots`       | `boolean`                                                       | `true`                | Every slot the same width. Off, slots hug their labels.                           |
| `stretch`           | `number`                                                        | `100`                 | How far a tap dilates the thumb across both slots. `0` is a plain slide.          |
| `squash`            | `number`                                                        | `3`                   | Pixels the trailing edge lands past the slot edge before it relaxes.              |
| `speed`             | `number`                                                        | `1`                   | Scales every phase together. `0.25` is slow motion.                               |
| `glide`             | `number`                                                        | `75`                  | How far a flick carries the thumb. `0` always lands on the nearest slot.          |
| `draggable`         | `boolean`                                                       | `true`                | Lets the thumb be grabbed, dragged and flicked.                                   |
| `disabled`          | `boolean`                                                       | `false`               | Dims the control and ignores input.                                               |
| `aria-label`        | `string`                                                        | `'Segmented control'` | Accessible name of the radio group.                                               |
| `class`             | `string`                                                        | `''`                  | Extra classes for the track.                                                      |

## Events

| Event               | Payload                          | Description                                         |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| `update:modelValue` | `(value: string)`                | Fires on a tap, a drag release and every arrow key. |
| `change`            | `(value: string, index: number)` | Same moments, with the slot index.                  |

## Accessibility

- The track is a `radiogroup`; each slot is a `radio` with `aria-checked`. Only the active slot is in the tab order.
- Arrow keys move the selection, Home and End jump to the ends. Keyboard changes jump the thumb without animation.
- Focus shows a ring in the thumb color.
- With `prefers-reduced-motion: reduce`, the thumb jumps instead of stretching, and drags do not rubber-band.

- Ported from [React Bits](https://reactbits.dev/micro/rubber-segment) by David Haz.
