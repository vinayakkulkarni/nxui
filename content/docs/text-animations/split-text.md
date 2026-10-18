---
title: Split Text
description: Splits text into letters, words or lines that rise, flip, pop, blur, skew or wave into place, loop, replay on hover or click, and lift under the cursor.
---

Text broken into letters, words or lines that animate in one after another when the text scrolls into view. Pick a reveal style (rise, fade, blur, flip, pop, skew or wave), let pieces pass through an accent color on the way in, loop the animation, or replay it on every hover or click. After the reveal, letters lift under the cursor or ripple from where it enters. Try the presets in the panel.

::demo-split-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/split-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import SplitText from '~/components/ui/split-text/SplitText.vue';

  function onDone() {
    console.log('All letters have animated!');
  }
</script>

<template>
  <SplitText
    text="Hello, you!"
    class="text-6xl font-extrabold"
    effect="rise"
    split-type="chars"
    :delay="50"
    :duration="1.25"
    hover-effect="lift"
    @letter-animation-complete="onDone"
  />

  <SplitText
    text="Flip on hover"
    effect="flip"
    trigger="hover"
    accent-color="#ff5a36"
  />
</template>
```

Custom `from` / `to` objects replace the effect, for example `:from="{ opacity: 0, y: 40, rotate: -8 }"`. Supported keys: `opacity`, `x`, `y` (px), `scale`, `rotate`, `rotateX`, `rotateY`, `skewX`, `skewY` (deg) and `blur` (px).

## Props

| Prop           | Type                                                                | Default    | Description                                                                                                                      |
| -------------- | ------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `text`         | `string`                                                            | —          | The text to animate                                                                                                              |
| `tag`          | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' \| 'p' \| 'span'`     | `'p'`      | Element to render                                                                                                                |
| `effect`       | `'rise' \| 'fade' \| 'blur' \| 'flip' \| 'pop' \| 'skew' \| 'wave'` | `'rise'`   | Reveal style. Ignored when `from` or `to` is set                                                                                 |
| `trigger`      | `'view' \| 'load' \| 'hover' \| 'click'`                            | `'view'`   | When the reveal plays. `view` waits until the text scrolls in, `load` plays right away, `hover`/`click` also replay it each time |
| `loop`         | `boolean`                                                           | `false`    | Animate the pieces out and back in, over and over                                                                                |
| `loop-delay`   | `number`                                                            | `1.5`      | Pause between loops (s)                                                                                                          |
| `hover-effect` | `'none' \| 'lift' \| 'wave'`                                        | `'none'`   | After the reveal: lift pieces near the cursor, or send a ripple from where the cursor enters                                     |
| `color`        | `string`                                                            | —          | Text color. Follows the surrounding color when unset                                                                             |
| `accent-color` | `string`                                                            | —          | Color each piece passes through while it reveals                                                                                 |
| `delay`        | `number`                                                            | `50`       | Delay between pieces (ms)                                                                                                        |
| `duration`     | `number`                                                            | `1.25`     | Duration of each piece (s)                                                                                                       |
| `ease`         | `string \| (t: number) => number`                                   | —          | GSAP-style ease name (`'power3.out'`, `'expo.out'`, `'back.out(2)'`, `'bounce.out'`, `'elastic.out(1, 0.3)'`) or a function      |
| `split-type`   | `string`                                                            | `'chars'`  | `'chars'`, `'words'`, `'lines'` or `'words, chars'`                                                                              |
| `stagger-from` | `'start' \| 'center' \| 'end' \| 'edges' \| 'random'`               | `'start'`  | Where the stagger starts                                                                                                         |
| `mask`         | `boolean`                                                           | `false`    | Clip each piece to its own box so it slides out from behind an edge                                                              |
| `from`         | `SplitTextVars`                                                     | —          | Custom start values, replacing the effect                                                                                        |
| `to`           | `SplitTextVars`                                                     | —          | Custom end values, replacing the effect                                                                                          |
| `threshold`    | `number`                                                            | `0.1`      | How far into the viewport the text must be before it plays (0–1)                                                                 |
| `root-margin`  | `string`                                                            | `'-100px'` | Extra offset for the start line (`px`, `em`, `rem` or `%`)                                                                       |
| `text-align`   | `string`                                                            | `'center'` | Text alignment                                                                                                                   |
| `class`        | `string`                                                            | `''`       | Extra classes on the root                                                                                                        |

## Events

| Event                       | Payload | Description                            |
| --------------------------- | ------- | -------------------------------------- |
| `letter-animation-complete` | —       | Fires once, when the first reveal ends |

## Accessibility

- The text stays real text in the DOM, so it can be selected and read by screen readers.
- With `prefers-reduced-motion: reduce` the text shows at once and the completion event still fires.
- With `trigger="click"` the root shows a pointer cursor; it is not focusable, so do not use it as the only way to reach an action.

- Ported from [React Bits](https://reactbits.dev/text-animations/split-text) by David Haz.
