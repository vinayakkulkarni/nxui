---
title: Fold Text
description: Lines unfold into place like creased paper opening flat.
---

# Fold Text

Text that unfolds piece by piece, like creased paper opening flat. Each character, word or line swings out from a hinge edge with a shadow along the crease. Pick paper folds, two-slat blinds or a full flip, and play it on mount, on hover, when it scrolls into view, or on a loop. With hover refold on, the letters near the pointer fold partly back up. Try the paper, blinds, flip and swing presets in the panel.

::demo-fold-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fold-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import FoldText from '~/components/ui/fold-text/FoldText.vue';
</script>

<template>
  <FoldText
    text="Design unfolds"
    fold-style="blinds"
    trigger="loop"
    stagger-from="center"
    ease="expo.out"
    :duration="1.1"
    :loop-delay="1.6"
    hover-refold
  />
</template>
```

## Props

| Prop             | Type                                                  | Default            | Description                                                                                                          |
| ---------------- | ----------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `text`           | `string`                                              | `'Design unfolds'` | The text to unfold. Use `\n` for line breaks.                                                                        |
| `split-by`       | `'char' \| 'word' \| 'line'`                          | `'char'`           | Fold each character, each word, or each line.                                                                        |
| `hinge`          | `'top' \| 'bottom' \| 'left' \| 'right'`              | `'top'`            | The edge each piece hinges on.                                                                                       |
| `fold-style`     | `'paper' \| 'blinds' \| 'flip'`                       | `'paper'`          | Paper folds from one edge, blinds open as two slats, flip turns a full half-turn.                                    |
| `duration`       | `number`                                              | `0.65`             | Seconds each piece takes to unfold.                                                                                  |
| `stagger`        | `number`                                              | `0.045`            | Seconds between pieces starting.                                                                                     |
| `stagger-from`   | `'start' \| 'center' \| 'end' \| 'edges' \| 'random'` | `'start'`          | Where the stagger starts.                                                                                            |
| `fold-angle`     | `number`                                              | `92`               | Angle, in degrees, a piece starts folded at. Flip always uses 180.                                                   |
| `ease`           | `string`                                              | `'power3.out'`     | GSAP-style ease name: `power1`–`power4`, `sine`, `expo`, `circ`, `back(n)`, `bounce` with `.in`, `.out` or `.inOut`. |
| `perspective`    | `number`                                              | `700`              | Perspective distance in pixels.                                                                                      |
| `crease-shading` | `number`                                              | `0.55`             | Strength, 0 to 1, of the shadow along the crease while a piece is folded.                                            |
| `trigger`        | `'mount' \| 'hover' \| 'scroll' \| 'loop'`            | `'mount'`          | When the text unfolds. `scroll` plays once when the top reaches 82% of the viewport.                                 |
| `loop-delay`     | `number`                                              | `1.4`              | Seconds the unfolded text holds before folding back up. Only for `loop`.                                             |
| `hover-refold`   | `boolean`                                             | `false`            | Pieces near the pointer fold partly back.                                                                            |
| `refold-radius`  | `number`                                              | `140`              | Pointer reach, in pixels, of the refold.                                                                             |
| `refold-angle`   | `number`                                              | `45`               | Largest refold angle, in degrees.                                                                                    |
| `font-size`      | `string \| number`                                    | `80`               | Font size. Numbers are pixels.                                                                                       |
| `font-weight`    | `string \| number`                                    | `800`              | Font weight.                                                                                                         |
| `color`          | `string`                                              | `'currentColor'`   | Text color.                                                                                                          |
| `class`          | `string`                                              | `''`               | Extra classes for the root element.                                                                                  |

## Accessibility

- The full text sits in a visually hidden span. The folding pieces are `aria-hidden`, so screen readers read the words once.
- With reduced motion, pieces fade in quickly with no fold, no crease shading and no refold.

- Ported from [React Bits](https://reactbits.dev/text-animations/fold-text) by David Haz.
