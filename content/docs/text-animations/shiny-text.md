---
title: Shiny Text
description: A band of light that sweeps across text, from a soft sheen to chrome-like reflections, on a loop, on hover, in view or following the pointer.
---

A band of light passes over the text on a loop. Tune its width, softness and tilt, add up to three bands for a chrome reflection, or a soft glow that travels with it. Switch the trigger to play once on hover or when scrolled into view, or turn on follow pointer and move over the text to steer the light.

::demo-shiny-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shiny-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import ShinyText from '~/components/ui/shiny-text/ShinyText.vue';
</script>

<template>
  <ShinyText
    text="Chrome finish"
    color="#8a8a8a"
    shine-color="#ffffff"
    :bands="3"
    :shine-width="18"
    :softness="0.3"
    :glow="0.4"
    easing="snappy"
    :delay="0.8"
    class="text-5xl font-semibold"
  />
</template>
```

The default slot can replace `text`. The text is painted with `background-clip: text`, so set the color through the `color` prop, not a text color class.

## Props

| Prop             | Type                               | Default     | Description                                                                         |
| ---------------- | ---------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `text`           | `string`                           | —           | Text to shine; the default slot works too                                           |
| `color`          | `string`                           | `'#b5b5b5'` | Base color of the text                                                              |
| `shine-color`    | `string`                           | `'#ffffff'` | Color of the light passing over it                                                  |
| `speed`          | `number`                           | `2`         | Seconds for one sweep across the text                                               |
| `delay`          | `number`                           | `0`         | Seconds of rest between sweeps                                                      |
| `angle`          | `number`                           | `120`       | Tilt of the band in degrees; 90 is upright, higher leans it forward                 |
| `shine-width`    | `number`                           | `40`        | Band width as a percentage of the text                                              |
| `softness`       | `number`                           | `0.8`       | Edge fade, from 0 for a crisp glint to 1 for a soft sheen                           |
| `bands`          | `number`                           | `1`         | How many bands follow each other (1–3), like reflections on chrome                  |
| `glow`           | `number`                           | `0`         | Soft bloom that travels with the band, 0–1                                          |
| `direction`      | `'left' \| 'right'`                | `'left'`    | Which way the light travels                                                         |
| `easing`         | `'smooth' \| 'linear' \| 'snappy'` | `'smooth'`  | Smooth glides in and out, linear keeps an even pace, snappy flashes across          |
| `trigger`        | `'loop' \| 'hover' \| 'view'`      | `'loop'`    | Shine on a loop, once each time the pointer enters, or once when scrolled into view |
| `yoyo`           | `boolean`                          | `false`     | Sweep back and forth instead of always starting from the same side                  |
| `follow-pointer` | `boolean`                          | `false`     | The light springs toward the pointer while it is over the text                      |
| `pause-on-hover` | `boolean`                          | `false`     | Freeze the sweep while the pointer is over the text                                 |
| `disabled`       | `boolean`                          | `false`     | Show plain text without the shine                                                   |
| `class`          | `string`                           | `''`        | Extra classes for the root element                                                  |

## Slots

| Slot      | Description                         |
| --------- | ----------------------------------- |
| `default` | Content to shine instead of `text`. |

## Accessibility

- The text stays real text, so it is selectable and read normally. The glow copy is `aria-hidden`.
- With `prefers-reduced-motion: reduce`, the loop, hover and view sweeps do not play; the text keeps its base color.
- The loop pauses while the text is off screen and sleeps between sweeps.

- Ported from [React Bits](https://reactbits.dev/text-animations/shiny-text) by David Haz.
