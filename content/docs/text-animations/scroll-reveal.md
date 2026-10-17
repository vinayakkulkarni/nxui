---
title: Scroll Reveal
description: Text that reveals by word, letter or line as you scroll, fading, rising, flipping or popping into place, with an optional accent highlight.
---

Scroll Reveal brings text in piece by piece as it scrolls into view. Pieces can be words, letters or whole rendered lines, and each one can brighten in place, rise up from behind its baseline, stand up from flat or pop up from small. Pieces can light up in an accent color as they arrive. By default the reveal follows the scroll position; set `mode="enter"` to play it once when the text comes into view. Scroll inside the demo and try the presets in the panel.

::demo-scroll-reveal
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-reveal.json"
```

## Usage

```vue
<script setup lang="ts">
  import { useTemplateRef } from 'vue';
  import ScrollReveal from '~/components/ui/scroll-reveal/ScrollReveal.vue';

  const scroller = useTemplateRef<HTMLElement>('scroller');
</script>

<template>
  <!-- "Highlight" preset inside a scrolling box -->
  <div ref="scroller" class="h-100 overflow-y-auto">
    <div class="px-12 pt-160 pb-120">
      <ScrollReveal
        text="When does a man die? When he is hit by a bullet? No! A man dies when he is forgotten!"
        :scroll-container="scroller"
        highlight-color="#ff5a1f"
        :stagger="0.2"
        :base-opacity="0.15"
        :base-rotation="0"
        :enable-blur="false"
      />
    </div>
  </div>
</template>
```

Leave `scroll-container` out to follow the page scroll. Without `text`, the default slot is revealed as one piece. Scroll positions use ScrollTrigger syntax (`"<trigger edge> <viewport edge>"`, such as `"bottom bottom"` or `"center 60%"`, with optional `+=`/`-=` px offsets) and run on a built-in scroll tracker, so GSAP is not needed.

## Props

| Prop                 | Type                                    | Default           | Description                                                                                                        |
| -------------------- | --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `text`               | `string`                                | —                 | Text to reveal. It is split into words, characters or lines. Leave it out to reveal the default slot as one piece. |
| `scroll-container`   | `HTMLElement \| null`                   | `undefined`       | Element that scrolls. `undefined` uses the page; `null` waits until the element exists.                            |
| `highlight-color`    | `string`                                | `''`              | Accent each piece lights up to while it is revealed, before settling to the text color. Empty for none.            |
| `mode`               | `'scrub' \| 'enter'`                    | `'scrub'`         | `scrub` ties the reveal to the scroll position, `enter` plays it once when the text scrolls into view.             |
| `split-by`           | `'words' \| 'chars' \| 'lines'`         | `'words'`         | What each step of the reveal is. `lines` groups the words of each rendered line and regroups on resize.            |
| `effect`             | `'fade' \| 'rise' \| 'flip' \| 'scale'` | `'fade'`          | `fade` brightens in place, `rise` slides up from behind its baseline, `flip` stands up, `scale` pops up.           |
| `stagger`            | `number`                                | `0.05`            | Spacing between pieces. Higher values reveal them one at a time. In enter mode it is in seconds.                   |
| `duration`           | `number`                                | `0.8`             | Seconds each piece takes to appear in enter mode.                                                                  |
| `smoothing`          | `number`                                | `0`               | Seconds the reveal takes to catch up with the scroll. `0` ties it to the scroll directly.                          |
| `enable-blur`        | `boolean`                               | `true`            | Starts each piece out of focus and sharpens it as it appears.                                                      |
| `blur-strength`      | `number`                                | `4`               | Starting blur in px.                                                                                               |
| `base-opacity`       | `number`                                | `0.1`             | Opacity of the pieces before they are revealed, from 0 to 1.                                                       |
| `base-rotation`      | `number`                                | `3`               | Tilt of the whole block before it levels out, in degrees. `0` keeps it level.                                      |
| `base-offset`        | `number`                                | `0`               | How far below its place each piece starts, in px.                                                                  |
| `rotation-end`       | `string`                                | `'bottom bottom'` | Scroll position where the block finishes leveling out in scrub mode.                                               |
| `word-animation-end` | `string`                                | `'bottom bottom'` | Scroll position where every piece is fully revealed in scrub mode. Text near the end of the page still finishes.   |
| `text-class`         | `string`                                | `''`              | Extra classes on the text.                                                                                         |
| `class`              | `string`                                | `''`              | Extra classes on the heading.                                                                                      |

## Slots

| Slot      | Description                                         |
| --------- | --------------------------------------------------- |
| `default` | Content revealed as one piece when `text` is unset. |

## Accessibility

- When `text` is set, the heading carries it as `aria-label` and the split pieces are `aria-hidden`, so screen readers read one sentence instead of fragments.
- With `prefers-reduced-motion: reduce` the text is shown at once, level and fully opaque.
- Scroll handling is passive, and the smoothing loop stops as soon as the reveal catches up.

- Ported from [React Bits](https://reactbits.dev/text-animations/scroll-reveal) by David Haz.
