---
title: Rotating Text
description: Cycles through words letter by letter with slide, flip, blur, scale or drop swaps, on an optional highlight block that resizes to fit each word.
---

Swaps between a list of texts on a timer. Each letter leaves and enters on its own, staggered from the first, last, center or a random letter. Pick slide, flip, blur, scale or drop and roll up or down. Turn on the highlight to set the text on a colored block that springs to the width of each word and picks a readable text color.

::demo-rotating-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/rotating-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import { useTemplateRef } from 'vue';
  import RotatingText from '~/components/ui/rotating-text/RotatingText.vue';

  const rotator = useTemplateRef('rotator');

  function onNext(index: number) {
    console.log('now showing', index);
  }
</script>

<template>
  <p class="flex items-center gap-[0.2em] text-5xl font-black">
    <span>Creative</span>
    <RotatingText
      ref="rotator"
      :texts="['thinking', 'coding', 'components!']"
      effect="drop"
      highlight
      highlight-color="#facc15"
      :stagger-duration="0.04"
      split-level-class="overflow-hidden pb-1"
      @next="onNext"
    />
  </p>
  <button type="button" @click="rotator?.next()">Next</button>
</template>
```

## Props

| Prop                       | Type                                                  | Default        | Description                                                                  |
| -------------------------- | ----------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `texts`                    | `string[]`                                            | —              | Texts to cycle through                                                       |
| `effect`                   | `'slide' \| 'flip' \| 'blur' \| 'scale' \| 'drop'`    | `'slide'`      | How letters swap: slide, roll over like a drum, dissolve, zoom, or drop in   |
| `direction`                | `'up' \| 'down'`                                      | `'up'`         | Which way letters roll                                                       |
| `highlight`                | `boolean`                                             | `false`        | Set the text on a colored block that resizes to fit each text                |
| `highlight-color`          | `string`                                              | `'#a855f7'`    | Block color; the text turns black or white for contrast                      |
| `rotation-interval`        | `number`                                              | `2000`         | ms between texts                                                             |
| `blur`                     | `number`                                              | `0`            | Blur (px) during the swap; the blur effect uses 10 when this is 0            |
| `stagger-duration`         | `number`                                              | `0`            | Seconds between letters                                                      |
| `stagger-from`             | `'first' \| 'last' \| 'center' \| 'random' \| number` | `'first'`      | Where the stagger starts; a number starts at that letter index               |
| `split-by`                 | `'characters' \| 'words' \| 'lines' \| string`        | `'characters'` | Animate letters, words, lines, or parts split by a custom separator          |
| `loop`                     | `boolean`                                             | `true`         | Go back to the first text after the last                                     |
| `auto`                     | `boolean`                                             | `true`         | Rotate on a timer; when off, drive it through the exposed methods            |
| `pause-on-hover`           | `boolean`                                             | `false`        | Hold the current text while the pointer is over it                           |
| `initial`                  | `VariantType`                                         | —              | Custom enter state for each letter (replaces the effect)                     |
| `animate`                  | `VariantType`                                         | —              | Custom rest state                                                            |
| `exit`                     | `VariantType`                                         | —              | Custom leave state                                                           |
| `transition`               | `Transition`                                          | —              | Custom motion-v transition for each letter and the layout                    |
| `animate-presence-mode`    | `'wait' \| 'sync' \| 'popLayout'`                     | `'wait'`       | `AnimatePresence` mode: wait for the old text to leave, or swap at once      |
| `animate-presence-initial` | `boolean`                                             | `false`        | Animate the first text on mount                                              |
| `split-level-class`        | `string`                                              | `''`           | Classes for each word wrapper, e.g. `overflow-hidden` to clip slide and drop |
| `element-level-class`      | `string`                                              | `''`           | Classes for each letter                                                      |
| `class`                    | `string`                                              | `''`           | Classes for the root                                                         |

## Events

| Event  | Payload           | Description                              |
| ------ | ----------------- | ---------------------------------------- |
| `next` | `(index: number)` | Fired each time the visible text changes |

## Exposed methods

Reach them through a template ref.

| Method          | Description                                      |
| --------------- | ------------------------------------------------ |
| `next()`        | Show the next text (wraps when `loop` is on)     |
| `previous()`    | Show the previous text (wraps when `loop` is on) |
| `jumpTo(index)` | Show the text at `index` (clamped)               |
| `reset()`       | Go back to the first text                        |

## Accessibility

- The current text sits in a visually hidden span; the animated letters are `aria-hidden`, so screen readers announce whole words.
- Motion follows `prefers-reduced-motion` through `MotionConfig reduced-motion="user"`, and the highlight block stops springing its width.
- The highlight picks black or white text from the block color's luminance, so any color stays readable.

- Ported from [React Bits](https://reactbits.dev/text-animations/rotating-text) by David Haz.
