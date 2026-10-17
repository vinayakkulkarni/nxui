---
title: Annotated Text
description: Inline text marked up by hand — circles, highlighter, underlines, brackets and cross-outs — with irregular strokes that draw themselves as they enter view.
---

Wrap a short phrase to mark it up like a pen on paper. Each of the twelve marks is a seeded, gently wobbling SVG stroke (or a CSS rule for the dotted and plain lines) that draws itself once, the first time it scrolls into view. Press replay to watch the strokes draw again.

::demo-annotated-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/annotated-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import AnnotatedText from '~/components/ui/annotated-text/AnnotatedText.vue';
</script>

<template>
  <p class="text-xl">
    Ship it
    <AnnotatedText variant="circle">today</AnnotatedText>, not
    <AnnotatedText variant="crossOut" :delay="0.4">next quarter</AnnotatedText>.
  </p>
</template>
```

The geometry comes from a fixed-seed random walk, so the server and the browser render the same paths and there is no hydration mismatch.

## Props

| Prop       | Type                                                                                                                                                                     | Default     | Description                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------- |
| `variant`  | `'wavy' \| 'underline' \| 'doubleUnderline' \| 'dottedUnderline' \| 'line' \| 'arrow' \| 'highlight' \| 'circle' \| 'box' \| 'bracket' \| 'strikethrough' \| 'crossOut'` | `'wavy'`    | Which hand-drawn mark to draw around the text.                                    |
| `color`    | `string`                                                                                                                                                                 | per variant | Tailwind text color class for the mark, e.g. `text-rose-400`.                     |
| `animate`  | `boolean`                                                                                                                                                                | `true`      | Draw the mark once when it enters view. Turned off by reduced-motion preferences. |
| `delay`    | `number`                                                                                                                                                                 | `0`         | Delay before drawing, in seconds.                                                 |
| `duration` | `number`                                                                                                                                                                 | `0.65`      | Duration of each stroke, in seconds. Multi-stroke marks stagger by 160 ms.        |
| `class`    | `string`                                                                                                                                                                 | `''`        | Extra classes for the wrapper span.                                               |

## Slots

| Name      | Description                                                             |
| --------- | ----------------------------------------------------------------------- |
| `default` | The words to annotate. Keep it to a short phrase; it stays on one line. |

## Accessibility

- The marks are decorative and carry `aria-hidden="true"`; screen readers read only the text.
- With `prefers-reduced-motion: reduce`, the marks appear fully drawn with no animation.
- Marks use `pointer-events-none`, so links or buttons inside the slot stay clickable.

- Ported from [componentry.fun](https://componentry.dev/docs/components/annotated-text) by Harsh Jadhav.
