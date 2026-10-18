---
title: Animated Content
description: Wrapper that reveals its content on scroll with slides, blur, 3D tilts, soft wipes, staggered children and scroll-linked progress.
---

Animated Content reveals whatever you put inside it when it scrolls into view. It can slide, fade, scale, blur in, rotate, flip up in 3D or appear behind a soft wipe. Give it a `stagger` and each direct child animates in turn, which suits lists and grids. It can also play on mount, replay every time it scrolls in, follow the scroll position with `scrub`, or hide itself again after a while. Scroll the demo and try the presets in the panel.

::demo-animated-content
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/animated-content.json"
```

## Usage

```vue
<script setup lang="ts">
  import AnimatedContent from '~/components/ui/animated-content/AnimatedContent.vue';

  const features = ['Instant deploys', 'Preview builds', 'Built-in safety'];
</script>

<template>
  <!-- "Blur" preset, children staggered -->
  <AnimatedContent
    :distance="40"
    :blur="12"
    :duration="1"
    :stagger="0.08"
    class="grid grid-cols-3 gap-4"
  >
    <div v-for="feature in features" :key="feature">{{ feature }}</div>
  </AnimatedContent>
</template>
```

Eases use GSAP names (`power1`–`power4`, `expo`, `sine`, `circ`, `back(n)`, `elastic(a, p)`, `bounce`, `none`, each with `.in`, `.out` or `.inOut`) and run on a built-in tween, so GSAP is not needed.

## Props

| Prop                 | Type                                                        | Default        | Description                                                                                    |
| -------------------- | ----------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `container`          | `string \| HTMLElement \| null`                             | `null`         | Scroll container that drives the animation, as a selector or an element. Defaults to the page. |
| `distance`           | `number`                                                    | `100`          | How far the content travels into place, in px.                                                 |
| `direction`          | `'vertical' \| 'horizontal'`                                | `'vertical'`   | Axis the content travels along.                                                                |
| `reverse`            | `boolean`                                                   | `false`        | Comes in from the other side: from above, or from the left.                                    |
| `duration`           | `number`                                                    | `0.8`          | Length of the animation, in seconds.                                                           |
| `ease`               | `string`                                                    | `'power3.out'` | GSAP-style ease, such as `'expo.out'`, `'back.out(1.6)'` or `'elastic.out(1, 0.5)'`.           |
| `initial-opacity`    | `number`                                                    | `0`            | Opacity the content starts from.                                                               |
| `animate-opacity`    | `boolean`                                                   | `true`         | Fades the content in. Turn off to keep it fully opaque while it moves.                         |
| `scale`              | `number`                                                    | `1`            | Scale the content starts from.                                                                 |
| `blur`               | `number`                                                    | `0`            | Blur the content starts from, in px. It comes into focus as it lands.                          |
| `rotate`             | `number`                                                    | `0`            | Rotation the content starts from, in degrees.                                                  |
| `tilt`               | `number`                                                    | `0`            | Tips the content back in 3D, in degrees, so it flips up into place.                            |
| `wipe`               | `'none' \| 'up' \| 'down' \| 'left' \| 'right' \| 'center'` | `'none'`       | Reveals the content behind a soft moving edge instead of all at once.                          |
| `threshold`          | `number`                                                    | `0.1`          | How far into the viewport the top of the content must be before it animates, from 0 to 1.      |
| `delay`              | `number`                                                    | `0`            | Wait before the animation starts, in seconds.                                                  |
| `stagger`            | `number`                                                    | `0`            | Animates each direct child in turn, this many seconds apart.                                   |
| `stagger-from`       | `'start' \| 'end' \| 'center' \| 'edges' \| 'random'`       | `'start'`      | Which child goes first when staggering.                                                        |
| `trigger`            | `'scroll' \| 'mount'`                                       | `'scroll'`     | Animate when the content scrolls into view, or right away.                                     |
| `once`               | `boolean`                                                   | `true`         | Plays once. Turn off to replay on every scroll in and reverse when it scrolls back out.        |
| `scrub`              | `boolean \| number`                                         | `false`        | Ties the animation to the scroll position. A number smooths it, in seconds.                    |
| `disappear-after`    | `number`                                                    | `0`            | Hides the content again this many seconds after it appears. 0 keeps it shown.                  |
| `disappear-duration` | `number`                                                    | `0.5`          | Length of the hide animation, in seconds.                                                      |
| `disappear-ease`     | `string`                                                    | `'power3.in'`  | Ease of the hide animation.                                                                    |
| `class`              | `string`                                                    | `''`           | Extra classes for the wrapper.                                                                 |

## Events

| Event                    | Description                  |
| ------------------------ | ---------------------------- |
| `start`                  | The animation starts.        |
| `complete`               | The animation finishes.      |
| `disappearance-complete` | The hide animation finishes. |

## Slots

| Slot      | Description                                                               |
| --------- | ------------------------------------------------------------------------- |
| `default` | The content to animate. With `stagger`, each direct child animates alone. |

## Accessibility

- With `prefers-reduced-motion: reduce` the content is shown at once with no movement, and `complete` still fires.
- The wrapper adds no roles or focus stops. Content is hidden with `visibility: hidden` only until the component mounts.
- When the reveal lands, transform, filter and mask styles are cleared so the content behaves like normal static markup.

- Ported from [React Bits](https://reactbits.dev/animations/animated-content) by David Haz.
