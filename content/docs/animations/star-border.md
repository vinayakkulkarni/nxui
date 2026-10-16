---
title: Star Border
description: A twinkling star that travels the exact outline of any button, pill or card, trailing light and stardust.
---

A canvas-drawn star glides at an even pace around the real outline of a button, pill or card, with a soft fading trail. Hover or tab to it to send the star on a fast lap, and press anywhere on the border to send light racing both ways from that point.

::demo-star-border
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/star-border.json"
```

## Usage

```vue
<script setup lang="ts">
  import StarBorder from '~/components/ui/star-border/StarBorder.vue';
</script>

<template>
  <StarBorder
    color="#ffcf8a"
    trail-color="#ff4d2e"
    :duration="4"
    :trail-length="0.45"
    :glow="0.8"
    hover="lap"
    @click="start"
  >
    Get started
  </StarBorder>

  <!-- Render as a link with three stars and stardust -->
  <StarBorder as="a" href="/docs" :stars="3" sparkle :radius="999">
    Read the docs
  </StarBorder>
</template>
```

## Props

| Prop               | Type                                        | Default       | Description                                                                                                   |
| ------------------ | ------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| `as`               | `string \| Component`                       | `'button'`    | Element or component to render, for example `a`, `div` or `NuxtLink`. Buttons get `type="button"` by default. |
| `color`            | `string`                                    | —             | Color of the star and its glow. Defaults to white on dark and ink on light.                                   |
| `trail-color`      | `string`                                    | —             | Color the trail fades into behind the star. Defaults to `color`.                                              |
| `duration`         | `number`                                    | `4`           | Seconds for one lap. The star keeps the same pace on any shape.                                               |
| `direction`        | `'clockwise' \| 'counterclockwise'`         | `'clockwise'` | Which way the star travels.                                                                                   |
| `stars`            | `number`                                    | `1`           | Stars spaced evenly around the border, up to 6.                                                               |
| `trail-length`     | `number`                                    | `0.3`         | Trail length as a share of the border. Trails stretch when the star speeds up.                                |
| `thickness`        | `number`                                    | `1`           | Border width in pixels.                                                                                       |
| `radius`           | `number`                                    | `12`          | Corner radius in pixels. Values past half the height give a pill.                                             |
| `glow`             | `number`                                    | `0.6`         | Bloom around the star and its trail, from 0 to 1.                                                             |
| `sparkle`          | `boolean`                                   | `false`       | Twinkling glint at the front of each trail that sheds fine stardust.                                          |
| `hover`            | `'lap' \| 'brighten' \| 'reveal' \| 'none'` | `'lap'`       | Hover and keyboard-focus behaviour: a fast lap, a stronger light, or a star hidden until you hover.           |
| `click-pulse`      | `boolean`                                   | `true`        | Sends light racing around the border from the point you press.                                                |
| `theme`            | `'dark' \| 'light'`                         | `'dark'`      | Picks the default surface, text, border and star colors.                                                      |
| `background-color` | `string`                                    | —             | Surface color. Follows the theme when not set.                                                                |
| `text-color`       | `string`                                    | —             | Text color. Follows the theme when not set.                                                                   |
| `border-color`     | `string`                                    | —             | Color of the resting border the star travels on. Follows the theme when not set.                              |
| `class`            | `string`                                    | `''`          | Extra classes for the root, for example to change padding or font. Utility classes override the base styles.  |

## Slots

| Slot      | Description                       |
| --------- | --------------------------------- |
| `default` | Button content (label and icons). |

## Accessibility

- Renders a real `<button type="button">` by default, so it is focusable and fires `click` on Enter and Space. Native attributes such as `disabled`, `href` or `aria-label` pass straight through.
- Keyboard focus shows a visible outline and triggers the same hover behaviour; a keyboard click pulses from the star's position.
- The light layer is a decorative `<canvas aria-hidden="true">`.
- With `prefers-reduced-motion: reduce` the star stops travelling and hover laps and stardust are off; it rests in place with a soft glow.
- The render loop sleeps when the star is idle or the button is off screen.

- Ported from [React Bits](https://reactbits.dev/animations/star-border) by David Haz.
