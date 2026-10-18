---
title: Count Up
description: Animated number counter that counts or rolls like an odometer, with formatting, decimals and compact units.
---

A number that counts from one value to another when it scrolls into view. In `roll` mode every digit becomes a column that spins into place like an odometer, staggered per column, with a soft motion blur while it moves. It can settle with a spring, shorten big numbers to 1.2K or 3.4M, and replay when you hover it. Try the presets in the panel.

::demo-count-up
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/count-up.json"
```

## Usage

```vue
<script setup lang="ts">
  import CountUp from '~/components/ui/count-up/CountUp.vue';

  function onEnd() {
    console.log('done');
  }
</script>

<template>
  <CountUp
    :from="0"
    :to="86420"
    mode="roll"
    easing="spring"
    separator=","
    :duration="2.4"
    replay-on-hover
    class="text-8xl font-semibold"
    @end="onEnd"
  />
</template>
```

## Props

| Prop              | Type                                          | Default      | Description                                                                             |
| ----------------- | --------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `to`              | `number`                                      | —            | The target number                                                                       |
| `from`            | `number`                                      | `0`          | The number the count starts from                                                        |
| `mode`            | `'count' \| 'roll'`                           | `'count'`    | `count` swaps the digits; `roll` spins each digit column like an odometer               |
| `easing`          | `'easeOut' \| 'linear' \| 'expo' \| 'spring'` | `'easeOut'`  | Pace of the count. `spring` overshoots slightly and settles on the final number         |
| `format`          | `'standard' \| 'compact'`                     | `'standard'` | `compact` shortens large numbers to 1.2K, 3.4M or 5.6B                                  |
| `decimals`        | `number`                                      | `undefined`  | Fixed decimals. When unset it follows the decimals in `from` and `to`                   |
| `direction`       | `'up' \| 'down'`                              | `'up'`       | `down` swaps `from` and `to` to count down                                              |
| `trigger`         | `'view' \| 'load'`                            | `'view'`     | `view` starts when the number scrolls into view, `load` starts right away               |
| `replay-on-hover` | `boolean`                                     | `false`      | Replay on hover. In roll mode every column spins once more and lands on the same number |
| `delay`           | `number`                                      | `0`          | Seconds before the count starts                                                         |
| `duration`        | `number`                                      | `2`          | How long the count takes, in seconds                                                    |
| `start-when`      | `boolean`                                     | `true`       | The count only starts while this is `true`                                              |
| `separator`       | `string`                                      | `''`         | Thousands separator                                                                     |
| `prefix`          | `string`                                      | `''`         | Text before the number, like a currency sign                                            |
| `suffix`          | `string`                                      | `''`         | Text after the number, like a percent sign or a unit                                    |
| `class`           | `string`                                      | `''`         | Extra classes on the root; size and weight the number with text utilities or `style`    |

## Events

| Event   | Payload | Description                  |
| ------- | ------- | ---------------------------- |
| `start` | —       | The count animation started  |
| `end`   | —       | The count animation finished |

## Accessibility

- In roll mode the spinning columns are `aria-hidden`; a visually hidden copy of the final number is read instead.
- With `prefers-reduced-motion: reduce` the number jumps straight to its final value.
- Digits use `tabular-nums`, so the width does not jitter while counting.

- Ported from [React Bits](https://reactbits.dev/text-animations/count-up) by David Haz.
