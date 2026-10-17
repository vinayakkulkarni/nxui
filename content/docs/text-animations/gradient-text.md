---
title: Gradient Text
description: Living gradients inside your text — a sliding sweep, a drifting mesh or a swinging conic fan, with an optional glow, border and colors that drift toward the cursor.
---

Gradient Text fills its content with a moving gradient. The `linear` variant slides a gradient through the text, `flow` drifts soft blobs of color around like a living mesh gradient and `conic` swings a fan of colors around a point below the text. Add a soft glow or a gradient pill border, pause it on hover, or let the colors lean toward the cursor with `follow-pointer`. Hover the demo and try the variants in the panel.

::demo-gradient-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gradient-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import GradientText from '~/components/ui/gradient-text/GradientText.vue';
</script>

<template>
  <GradientText
    class="text-5xl/normal font-semibold"
    :colors="['#5227FF', '#FF9FFC', '#B497CF']"
    variant="flow"
    :animation-speed="8"
    :glow="0.4"
    follow-pointer
  >
    Gradient Magic
  </GradientText>
</template>
```

The text inherits its size and weight from the surrounding element or the classes you pass. Keep a normal line height: the gradient is painted inside the line box, so a tight `leading-none` clips descenders.

## Props

| Prop              | Type                                       | Default                             | Description                                                                               |
| ----------------- | ------------------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `colors`          | `string[]`                                 | `['#5227FF', '#FF9FFC', '#B497CF']` | Gradient colors. A single color is repeated.                                              |
| `animation-speed` | `number`                                   | `8`                                 | Seconds for one sweep of the gradient. Lower is faster.                                   |
| `variant`         | `'linear' \| 'flow' \| 'conic'`            | `'linear'`                          | How the colors move: a sliding sweep, drifting blobs of color or a swinging conic fan.    |
| `angle`           | `number`                                   | `90`                                | Gradient angle in degrees.                                                                |
| `direction`       | `'horizontal' \| 'vertical' \| 'diagonal'` | —                                   | Shortcut for `angle` (90, 180, 135). Wins over `angle` when set.                          |
| `scale`           | `number`                                   | `3`                                 | How stretched the gradient is, from 1 to 6. Larger values show fewer colors at once.      |
| `yoyo`            | `boolean`                                  | `true`                              | Swing back and forth instead of looping in one direction (`linear` and `conic`).          |
| `glow`            | `number`                                   | `0`                                 | Strength of a soft blurred copy behind the text, from 0 to 1.                             |
| `show-border`     | `boolean`                                  | `false`                             | Wraps the text in a pill with a border drawn in the same gradient.                        |
| `border-width`    | `number`                                   | `1.5`                               | Border width in px.                                                                       |
| `pause-on-hover`  | `boolean`                                  | `false`                             | Freezes the colors while the pointer is over the text.                                    |
| `follow-pointer`  | `boolean`                                  | `false`                             | Pulls the colors toward the cursor on a spring, and lets them settle back when it leaves. |
| `class`           | `string`                                   | `''`                                | Extra classes on the root.                                                                |

## Slots

| Slot      | Description                           |
| --------- | ------------------------------------- |
| `default` | The text (or inline content) to fill. |

## Accessibility

- The glow is a decorative copy marked `aria-hidden`, so the text is read once.
- With `prefers-reduced-motion: reduce` the colors stay still; `follow-pointer` still eases toward the cursor and back.
- The animation loop sleeps while the text is off screen and while it is paused with nothing left to settle.

- Ported from [React Bits](https://reactbits.dev/text-animations/gradient-text) by David Haz.
