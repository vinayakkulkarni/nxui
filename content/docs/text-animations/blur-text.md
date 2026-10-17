---
title: Blur Text
description: Text that blurs into focus word by word or letter by letter, with zoom, 3D tilt, focus-pull and drift effects, looping, hover and click replay and a start color.
---

Text that starts blurred and resolves crisply, one word or letter at a time. Pieces can slide in, zoom down, tilt in on a 3D angle, pull into focus in place or drift in with a lean, and the stagger can start at the beginning, the middle, the end or in a shuffled order. It plays when scrolled into view or on load, or it shows straight away and replays each time you hover or click it. It can also loop, start in a second color and keep the hovered word sharp while the rest soften. Pick a preset or tune it in the panel.

::demo-blur-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/blur-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import BlurText from '~/components/ui/blur-text/BlurText.vue';

  function onComplete() {
    console.log('Animation finished');
  }
</script>

<template>
  <BlurText
    text="Isn't this so cool?!"
    effect="tilt"
    animate-by="letters"
    direction="bottom"
    from-color="#ff5a36"
    :delay="40"
    :step-duration="0.45"
    class="text-5xl font-extrabold"
    @animation-complete="onComplete"
  />
</template>
```

Pass `animation-from` and `animation-to` to replace the built-in effects with your own keyframes, for example `:animation-from="{ filter: 'blur(10px)', opacity: 0, y: -50 }"` and `:animation-to="[{ filter: 'blur(0px)', opacity: 1, y: 0 }]"`.

## Props

| Prop             | Type                                               | Default   | Description                                                                                                                                                              |
| ---------------- | -------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `text`           | `string`                                           | `''`      | The text to animate                                                                                                                                                      |
| `effect`         | `'blur' \| 'zoom' \| 'tilt' \| 'focus' \| 'drift'` | `'blur'`  | How each piece comes in. Blur slides in from a side, zoom shrinks down from large, tilt swings in on a 3D angle, focus sharpens in place and drift glides in with a lean |
| `animate-by`     | `'words' \| 'letters'`                             | `'words'` | Whether each word or each letter comes into focus on its own                                                                                                             |
| `direction`      | `'top' \| 'bottom' \| 'left' \| 'right'`           | `'top'`   | Side the pieces move in from. Drift always glides sideways, from the right only when set to right                                                                        |
| `stagger-from`   | `'start' \| 'center' \| 'end' \| 'random'`         | `'start'` | Where the stagger starts: the first piece, the middle, the last piece or a shuffled order                                                                                |
| `trigger`        | `'view' \| 'load' \| 'hover' \| 'click'`           | `'view'`  | When the text comes in. Hover and click show the text and replay it each time it is hovered or clicked                                                                   |
| `delay`          | `number`                                           | `200`     | Delay between each word or letter, in ms                                                                                                                                 |
| `step-duration`  | `number`                                           | `0.35`    | The time taken for each step of the animation, in seconds                                                                                                                |
| `loop`           | `boolean`                                          | `false`   | Keeps replaying: the text holds, blurs back out and comes in again                                                                                                       |
| `loop-delay`     | `number`                                           | `2`       | How long the text stays sharp before it blurs out again when looping, in seconds                                                                                         |
| `blur`           | `number`                                           | `10`      | How blurred each piece starts, in px                                                                                                                                     |
| `distance`       | `number`                                           | `50`      | How far each piece travels into place, in px. `0` keeps them still so they only come into focus                                                                          |
| `color`          | `string`                                           | —         | Color of the text. Follows the surrounding text color when unset                                                                                                         |
| `from-color`     | `string`                                           | —         | Color each piece starts in before it settles on the text color                                                                                                           |
| `focus-on-hover` | `boolean`                                          | `false`   | Hovering a word keeps it sharp while the other words soften and dim                                                                                                      |
| `threshold`      | `number`                                           | `0.1`     | Intersection threshold for the view trigger                                                                                                                              |
| `root-margin`    | `string`                                           | `'0px'`   | Root margin for the intersection observer                                                                                                                                |
| `animation-from` | `Record<string, string \| number>`                 | —         | Custom starting keyframe. Replaces the effect, blur, distance and direction settings                                                                                     |
| `animation-to`   | `Record<string, string \| number>[]`               | —         | Custom keyframes to animate through after `animation-from`                                                                                                               |
| `easing`         | `Easing \| Easing[]`                               | —         | motion-v easing applied to every step. Each effect uses its own tuned curves when unset                                                                                  |
| `class`          | `string`                                           | `''`      | Classes merged onto the paragraph                                                                                                                                        |

## Events

| Event                | Payload | Description                                 |
| -------------------- | ------- | ------------------------------------------- |
| `animation-complete` | —       | Fires each time the text finishes coming in |

## Accessibility

- The full text lives in a visually hidden span; the animated pieces are `aria-hidden`, so screen readers read the sentence once.
- Movement follows the user's reduced-motion setting through `MotionConfig`: transforms are skipped and only the fade and blur play.

- Ported from [React Bits](https://reactbits.dev/text-animations/blur-text) by David Haz.
