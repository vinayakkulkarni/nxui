---
title: Scroll Float
description: Scroll-linked text whose letters float, flip, scatter, blur or wave into place, by letter or by word, in any order and from an accent color.
---

Scroll Float animates a heading as it scrolls through the view, tied to the scroll position. Letters can stretch up out of a slot, roll in on a drum, assemble from random spots, pull into focus or swell in on a rolling wave. Animate each letter or each word, from below or above, and pick which pieces go first. With `from-color` the pieces arrive in an accent color and settle to the text color. Scroll inside the demo and try the presets in the panel.

::demo-scroll-float
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-float.json"
```

## Usage

```vue
<script setup lang="ts">
  import { useTemplateRef } from 'vue';
  import ScrollFloat from '~/components/ui/scroll-float/ScrollFloat.vue';

  const scroller = useTemplateRef<HTMLElement>('scroller');
</script>

<template>
  <!-- "Scatter" preset inside a scrolling box -->
  <div ref="scroller" class="h-100 overflow-y-auto">
    <div class="px-12 pt-190 pb-130">
      <ScrollFloat
        text="Vue nxui"
        :scroll-container="scroller"
        effect="scatter"
        order="random"
        ease="sine.inOut"
        from-color="#ff6b3d"
        :stagger="0.09"
        :smoothing="0.5"
        :distance="170"
      />
    </div>
  </div>
</template>
```

Leave `scroll-container` out to follow the page scroll. Without `text`, the default slot moves in as one piece. Eases use GSAP names (`power1`–`power4`, `expo`, `sine`, `circ`, `back(n)`, `elastic(a, p)`, `bounce`, `none`, each with `.in`, `.out` or `.inOut`) and scroll positions use ScrollTrigger syntax; both run on built-in code, so GSAP is not needed.

## Props

| Prop                 | Type                                                  | Default                | Description                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`               | `string`                                              | —                      | Text to animate, split into letters or words. Leave it out to animate the default slot as one piece.                                                                                |
| `scroll-container`   | `HTMLElement \| null`                                 | `undefined`            | Element that scrolls. `undefined` uses the page; `null` waits until the element exists.                                                                                             |
| `effect`             | `'float' \| 'flip' \| 'scatter' \| 'blur' \| 'wave'`  | `'float'`              | Float stretches pieces up out of a slot, flip rolls them in on a drum, scatter assembles them from random spots, blur pulls them into focus, wave swells them in on a rolling wave. |
| `split-by`           | `'chars' \| 'words'`                                  | `'chars'`              | Animate each letter on its own or each word as one piece.                                                                                                                           |
| `direction`          | `'up' \| 'down'`                                      | `'up'`                 | Whether the pieces come in from below or from above.                                                                                                                                |
| `order`              | `'start' \| 'end' \| 'center' \| 'edges' \| 'random'` | `'start'`              | Which pieces go first. The random order is fixed, so it looks the same on every visit.                                                                                              |
| `from-color`         | `string`                                              | `'currentColor'`       | Color the pieces start in before they settle to the text color. `currentColor` turns the shift off.                                                                                 |
| `animation-duration` | `number`                                              | `1`                    | Length of each piece's animation, relative to the stagger.                                                                                                                          |
| `ease`               | `string`                                              | `'back.inOut(2)'`      | GSAP-style ease for the motion.                                                                                                                                                     |
| `stagger`            | `number`                                              | `0.03`                 | Delay between pieces, relative to the duration.                                                                                                                                     |
| `distance`           | `number`                                              | `120`                  | How far the pieces travel. `120` is the default reach; `0` keeps them in place.                                                                                                     |
| `stretch`            | `number`                                              | `2.3`                  | How tall the pieces are stretched while they float or wave in.                                                                                                                      |
| `smoothing`          | `number`                                              | `0`                    | Seconds the animation takes to catch up with the scroll. `0` ties it to the scroll directly.                                                                                        |
| `scroll-start`       | `string`                                              | `'center bottom+=50%'` | Scroll position where the animation starts.                                                                                                                                         |
| `scroll-end`         | `string`                                              | `'bottom bottom-=40%'` | Scroll position where the animation ends. Clamped so text near the end of the page still finishes.                                                                                  |
| `text-class`         | `string`                                              | `''`                   | Extra classes on the text.                                                                                                                                                          |
| `class`              | `string`                                              | `''`                   | Extra classes on the heading.                                                                                                                                                       |

## Slots

| Slot      | Description                                         |
| --------- | --------------------------------------------------- |
| `default` | Content animated as one piece when `text` is unset. |

## Accessibility

- When `text` is set, a visually hidden copy carries the full sentence and the split letters are `aria-hidden`.
- With `prefers-reduced-motion: reduce` the text is shown at once in its final place.
- Scroll handling is passive, and the smoothing loop stops as soon as the animation catches up.

- Ported from [React Bits](https://reactbits.dev/text-animations/scroll-float) by David Haz.
