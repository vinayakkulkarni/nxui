---
title: Shuffle
description: Letters slide past as a reel, flip like cards in 3D or spin in place with motion blur through random glyphs before they land.
---

Text that shuffles into place when it scrolls into view. Each letter cycles through interim glyphs as a sliding reel, a 3D card flip or an in-place spin with motion blur, then lands sharp. Hover to replay it, or set a hover radius so only the letters near the cursor reshuffle. Pick a preset or tune the effect in the panel.

::demo-shuffle
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shuffle.json"
```

## Usage

```vue
<script setup lang="ts">
  import Shuffle from '~/components/ui/shuffle/Shuffle.vue';
</script>

<template>
  <Shuffle
    text="Vue nxui"
    effect="flip"
    shuffle-direction="down"
    animation-mode="sequence"
    ease="power2.out"
    :duration="1.1"
    :shuffle-times="7"
    :stagger="0.07"
    scramble-charset="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    accent-color="#ff5a36"
    @shuffle-complete="console.log('done')"
  />
</template>
```

The default type is the pixel face [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) with a monospace fallback; load it in your app or pass any `font-*` class. The component re-measures the letters when a web font finishes loading, so the reel never clips.

## Props

| Prop                     | Type                                                            | Default        | Description                                                                                                                          |
| ------------------------ | --------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `text`                   | `string`                                                        | —              | The text to shuffle                                                                                                                  |
| `effect`                 | `'slide' \| 'flip' \| 'blur'`                                   | `'slide'`      | A reel that slides past, a card that flips in 3D through random glyphs, or glyphs that spin in place with motion blur                |
| `shuffle-direction`      | `'left' \| 'right' \| 'up' \| 'down'`                           | `'right'`      | Direction letters travel. Flip turns around the matching axis                                                                        |
| `duration`               | `number`                                                        | `0.35`         | Duration (s) of each letter's shuffle                                                                                                |
| `max-delay`              | `number`                                                        | `0`            | Longest random delay (s) before a letter starts, when `animation-mode` is `'random'`                                                 |
| `ease`                   | `string \| (t: number) => number`                               | `'power3.out'` | GSAP-style ease name (`power2.out`, `back.out(2)`, `expo.out`, …) or a function. Back eases make letters overshoot as they land      |
| `threshold`              | `number`                                                        | `0.1`          | Portion of the element that must be visible before it starts                                                                         |
| `root-margin`            | `string`                                                        | `'-100px'`     | Offset applied to the bottom of the viewport before the shuffle starts                                                               |
| `tag`                    | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' \| 'p' \| 'span'` | `'p'`          | HTML tag for the text container                                                                                                      |
| `text-align`             | `string`                                                        | `'center'`     | Text alignment                                                                                                                       |
| `shuffle-times`          | `number`                                                        | `1`            | How many interim glyphs each letter passes through before it lands                                                                   |
| `animation-mode`         | `'evenodd' \| 'sequence' \| 'center' \| 'random'`               | `'evenodd'`    | Order the letters start in: odd then even, left to right, outward from the middle, or after random delays                            |
| `loop`                   | `boolean`                                                       | `false`        | Repeat the shuffle indefinitely, with fresh glyphs each round                                                                        |
| `loop-delay`             | `number`                                                        | `0`            | Delay (s) between loop repeats                                                                                                       |
| `stagger`                | `number`                                                        | `0.03`         | Delay (s) between letters starting, in every mode except `'random'`                                                                  |
| `scramble-charset`       | `string`                                                        | `''`           | Characters used for interim glyphs; empty repeats the letter itself                                                                  |
| `motion-blur`            | `boolean`                                                       | `false`        | Smears the sliding reel along its direction while it moves fast. Slide effect only                                                   |
| `color`                  | `string`                                                        | `''`           | Text color. Follows the surrounding text color when unset                                                                            |
| `accent-color`           | `string`                                                        | `''`           | Color of the interim glyphs while letters are in flight                                                                              |
| `color-from`             | `string`                                                        | `''`           | Color each letter starts in, fading to its final color as it lands                                                                   |
| `color-to`               | `string`                                                        | `''`           | Color each letter fades to as it lands, and keeps afterwards                                                                         |
| `trigger-once`           | `boolean`                                                       | `true`         | Auto-run only the first time it scrolls into view                                                                                    |
| `respect-reduced-motion` | `boolean`                                                       | `true`         | Show the text right away, without shuffling, when the user prefers reduced motion                                                    |
| `trigger-on-hover`       | `boolean`                                                       | `true`         | Replay the shuffle on hover after it completes                                                                                       |
| `hover-radius`           | `number`                                                        | `0`            | With hover replay on, only letters within this distance (px) of the cursor reshuffle, closer ones longer. `0` replays the whole text |
| `class`                  | `string`                                                        | `''`           | Classes merged onto the root element                                                                                                 |

## Events

| Event              | Payload | Description                                               |
| ------------------ | ------- | --------------------------------------------------------- |
| `shuffle-complete` | —       | Fires after a full run completes, and on each loop repeat |

## Accessibility

- The settled text is the real text content, so screen readers and search engines read it as plain text.
- With `respect-reduced-motion` on, users who prefer reduced motion see the text immediately, without any shuffling.
- Hover replay is decorative; the text never depends on it.

- Ported from [React Bits](https://reactbits.dev/text-animations/shuffle) by David Haz.
