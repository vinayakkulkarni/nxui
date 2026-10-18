---
title: Wake Slider
description: Thumbless range slider of thin bars where drag speed raises a wake behind the handle.
---

A range slider drawn as a row of thin bars, with no thumb. Bars up to the value are lit. Drag fast and the bars around the handle rise into a wake that trails behind it; drag slowly and the row stays flat. Arrow keys, Page Up/Down, Home and End move it in steps.

::demo-wake-slider
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/wake-slider.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import WakeSlider from '~/components/ui/wake-slider/WakeSlider.vue';

  const volume = ref(50);

  function percent(value: number) {
    return `${value}%`;
  }
</script>

<template>
  <WakeSlider
    v-model="volume"
    :bars="32"
    :reach="6"
    :skew="0.6"
    crest-color="#a855f7"
    show-value
    :format-value="percent"
    aria-label="Volume"
  />
</template>
```

The handle position follows the value through a critically damped spring (`glide` seconds to settle). Its velocity, smoothed by a second spring (`smoothing` ms), sets the wake height. Each bar near the handle lifts by a cosine-squared profile that reaches further behind the motion than ahead of it (`skew`).

## Props

| Prop            | Type                        | Default               | Description                                                                       |
| --------------- | --------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `model-value`   | `number`                    | —                     | Controlled value (`v-model`).                                                     |
| `default-value` | `number`                    | `50`                  | Initial value when uncontrolled.                                                  |
| `min`           | `number`                    | `0`                   | Lowest value.                                                                     |
| `max`           | `number`                    | `100`                 | Highest value.                                                                    |
| `step`          | `number`                    | `1`                   | Snapping grid. Large steps move the handle in notches; the wake pulses per notch. |
| `bars`          | `number`                    | `32`                  | How many bars draw the track.                                                     |
| `height`        | `number`                    | `56`                  | Full bar height in pixels, the ceiling of the wake.                               |
| `rest-height`   | `number`                    | `12`                  | Bar height at rest in pixels.                                                     |
| `gap`           | `number`                    | `4`                   | Space between bars in pixels.                                                     |
| `fill-color`    | `string`                    | `'var(--foreground)'` | Lit bars, up to the value.                                                        |
| `track-color`   | `string`                    | `'var(--muted)'`      | Unlit bars.                                                                       |
| `crest-color`   | `string`                    | `''`                  | Optional tint the raised bars take on by their lift. Empty renders no tint layer. |
| `sensitivity`   | `number`                    | `1`                   | How easily speed raises the wake. Low needs a flick; high lifts on a stroll.      |
| `reach`         | `number`                    | `6`                   | Half-width of the wake at full speed, in bars.                                    |
| `skew`          | `number`                    | `0.6`                 | How much wider the wake is behind the handle than ahead. 0 is symmetric.          |
| `glide`         | `number`                    | `0.3`                 | Seconds the handle takes to settle. Short hugs the finger; long floats.           |
| `smoothing`     | `number`                    | `100`                 | Milliseconds of velocity lag. Low twitches; high lingers.                         |
| `show-value`    | `boolean`                   | `false`               | Shows the value beside the track.                                                 |
| `format-value`  | `(value: number) => string` | —                     | Formats the readout and the announced value.                                      |
| `disabled`      | `boolean`                   | `false`               | Fades the slider and ignores input.                                               |
| `aria-label`    | `string`                    | `'Value'`             | Accessible name of the slider.                                                    |
| `class`         | `HTMLAttributes['class']`   | —                     | Extra classes for the root.                                                       |

## Events

| Event               | Payload           | Description                                               |
| ------------------- | ----------------- | --------------------------------------------------------- |
| `update:modelValue` | `(value: number)` | Every committed change, from the pointer or the keyboard. |
| `change`            | `(value: number)` | Same as above, for uncontrolled use.                      |

## Accessibility

- The track holds a full-size `role="slider"` button with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext` (from `format-value`).
- Arrow keys move one step, Page Up/Down ten steps, Home/End jump to the ends. Keyboard moves skip the wake and jump straight to the value.
- Keyboard focus shows a ring around the track.
- With `prefers-reduced-motion: reduce` the bars never rise; only the lit range changes.

- Ported from [React Bits](https://reactbits.dev/micro/wake-slider) by David Haz.
