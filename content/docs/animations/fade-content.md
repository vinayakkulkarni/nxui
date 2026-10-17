---
title: Fade Content
description: Wrapper that fades content in on scroll, plain or out of focus, from washed-out gray, or through grain, mist and pixel blocks.
---

Wrap anything to fade it in when it scrolls into view. Pick a plain fade, an out-of-focus pull, a washed-out photo that develops, or a noise reveal through fine grain, drifting mist or pixel blocks. Stagger the direct children, tie the fade to the scroll position, or fade back out as the content leaves. Scroll inside the demo panel to see it.

::demo-fade-content
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fade-content.json"
```

## Usage

```vue
<script setup lang="ts">
  import FadeContent from '~/components/ui/fade-content/FadeContent.vue';
</script>

<template>
  <FadeContent effect="mist" :duration="1.8">
    <h2>Slow light over the bay</h2>
  </FadeContent>

  <FadeContent
    effect="pixel"
    :stagger="0.1"
    stagger-from="center"
    class="grid grid-cols-3 gap-3"
  >
    <img v-for="src in photos" :key="src" :src="src" alt="" />
  </FadeContent>

  <FadeContent effect="focus" exit :scrub="0.5">
    <p>Sharp only while it sits in the middle of the view.</p>
  </FadeContent>
</template>
```

The noise effects build a small SVG filter per target (`feTurbulence` thresholded by a moving front), so they work on any content, including images and text. Easing names follow GSAP (`power2.out`, `expo.inOut`, `sine.in`, `none`), but the component has no GSAP dependency.

## Props

| Prop                 | Type                                                                | Default        | Description                                                                                         |
| -------------------- | ------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `container`          | `string \| HTMLElement \| null`                                     | `null`         | Scroll container that drives the fade, as a selector or an element. Defaults to the page.           |
| `effect`             | `'fade' \| 'focus' \| 'develop' \| 'dissolve' \| 'mist' \| 'pixel'` | `'fade'`       | Plain fade, out of focus, from washed-out gray, through grain, through mist, or block by block.     |
| `blur`               | `boolean \| number`                                                 | `false`        | Extra blur the content starts from, in px. `true` adds 10px.                                        |
| `duration`           | `number`                                                            | `1`            | Length of the fade in seconds. Values above 10 are read as milliseconds.                            |
| `ease`               | `string`                                                            | `'power2.out'` | Ease name: `power1`–`power4`, `sine`, `expo`, `circ`, `back` with `.in`/`.out`/`.inOut`, or `none`. |
| `delay`              | `number`                                                            | `0`            | Wait before the fade starts, in seconds.                                                            |
| `threshold`          | `number`                                                            | `0.1`          | How far into the viewport the top of the content must be before it fades in, 0–1.                   |
| `initial-opacity`    | `number`                                                            | `0`            | Opacity the content starts from.                                                                    |
| `stagger`            | `number`                                                            | `0`            | Fades each direct child in turn, this many seconds apart.                                           |
| `stagger-from`       | `'start' \| 'end' \| 'center' \| 'edges' \| 'random'`               | `'start'`      | Which child goes first when staggering.                                                             |
| `trigger`            | `'scroll' \| 'mount'`                                               | `'scroll'`     | Fade in when the content scrolls into view, or right away.                                          |
| `once`               | `boolean`                                                           | `true`         | Fades in once. Turn off to fade back out when the content scrolls back below the view.              |
| `exit`               | `boolean`                                                           | `false`        | Fades the content back out as it scrolls off the top, and in again when it comes back.              |
| `scrub`              | `boolean \| number`                                                 | `false`        | Ties the fade to the scroll position instead of playing it. A number smooths it, in seconds.        |
| `disappear-after`    | `number`                                                            | `0`            | Fades the content out again this many seconds after it appears. `0` keeps it shown.                 |
| `disappear-duration` | `number`                                                            | `0.5`          | Length of the fade out, in seconds.                                                                 |
| `disappear-ease`     | `string`                                                            | `'power2.in'`  | Ease of the fade out.                                                                               |
| `class`              | `string`                                                            | `''`           | Extra classes for the wrapper.                                                                      |

## Events

| Event                    | Description                                |
| ------------------------ | ------------------------------------------ |
| `start`                  | The fade starts.                           |
| `complete`               | The fade finishes.                         |
| `disappearance-complete` | The fade out (`disappear-after`) finishes. |

## Slots

| Slot      | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `default` | Content to fade in. With `stagger`, each direct child fades alone. |

## Accessibility

- With `prefers-reduced-motion: reduce` the content shows at once and `complete` fires right away.
- Content stays in the DOM the whole time; hidden parts use `visibility: hidden`, so they are skipped by screen readers until they appear.
- The wrapper starts hidden until the client runs, so content wrapped in it is not visible without JavaScript.

- Ported from [React Bits](https://reactbits.dev/animations/fade-content) by David Haz.
