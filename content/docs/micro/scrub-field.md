---
title: Scrub Field
description: Number chip you drag to scrub, with rubber-band limits and click to type.
---

A number field you scrub like a design-tool inspector. Drag sideways to change the value; a pill above the cursor shows the change since you grabbed it. Past the limits the number rubber-bands and springs back on release. Hold Shift for coarse steps, Alt for fine steps, press Escape to cancel. Click without dragging to type a value.

::demo-scrub-field
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scrub-field.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ScrubField from '~/components/ui/scrub-field/ScrubField.vue';

  const radius = ref(24);
</script>

<template>
  <ScrubField
    v-model="radius"
    label="Radius"
    suffix="px"
    :min="0"
    :max="100"
    :step="1"
    :rubber-reach="8"
    @commit="(value) => console.log('committed', value)"
  />
</template>
```

The shown number is a motion value. Inside the range it follows the pointer step by step; past a limit it is bent with a logarithmic curve, so the overshoot slows down the farther you pull. The emitted value is always clamped to `min`–`max`.

## Props

| Prop                | Type                   | Default     | Description                                                                                 |
| ------------------- | ---------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `label`             | `string`               | `'Radius'`  | Label on the left. It is also the drag handle.                                              |
| `suffix`            | `string`               | `'px'`      | Unit after the number.                                                                      |
| `model-value`       | `number`               | `undefined` | Controlled value (`v-model`).                                                               |
| `default-value`     | `number`               | `24`        | Initial value when uncontrolled. Also the reference for the dirty ring.                     |
| `min`               | `number`               | `0`         | Lowest value.                                                                               |
| `max`               | `number`               | `100`       | Highest value.                                                                              |
| `step`              | `number`               | `1`         | Value change per drag step and per arrow key.                                               |
| `size`              | `'sm' \| 'md' \| 'lg'` | `'md'`      | Chip height 28, 34 or 44 px; width and font follow.                                         |
| `sensitivity`       | `number`               | `2`         | Pixels of drag per step.                                                                    |
| `rubber-reach`      | `number`               | `8`         | How far past a limit the number can stretch, as a percent of the range. `0` is a hard stop. |
| `return-duration`   | `number`               | `300`       | Spring back duration after an overshoot, in ms.                                             |
| `coarse-multiplier` | `number`               | `10`        | Step multiplier while Shift is held, and for Page Up / Page Down.                           |
| `fine-multiplier`   | `number`               | `0.1`       | Step multiplier while Alt is held.                                                          |
| `show-delta`        | `boolean`              | `true`      | Show the change pill above the cursor while dragging.                                       |
| `show-dirty`        | `boolean`              | `false`     | Ring the chip when the value differs from `default-value`.                                  |
| `show-fill`         | `boolean`              | `true`      | Tint the chip from the left in proportion to the value.                                     |
| `accent`            | `string`               | `'#f5f5f5'` | Fill, dirty ring and delta pill color.                                                      |
| `chip-color`        | `string`               | `'#27272a'` | Chip background.                                                                            |
| `disabled`          | `boolean`              | `false`     | Dims the chip and ignores input.                                                            |
| `class`             | `string`               | `''`        | Extra classes for the chip.                                                                 |

## Events

| Event               | Payload           | Description                                                |
| ------------------- | ----------------- | ---------------------------------------------------------- |
| `update:modelValue` | `(value: number)` | Every value change, live while dragging.                   |
| `change`            | `(value: number)` | Same as above.                                             |
| `commit`            | `(value: number)` | Once per gesture: drag release, arrow key, or typed value. |

## Accessibility

- The value is an `input` with `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` including the unit.
- The label is a real `<label>` for the input. Tab focuses the input and selects its text.
- Arrow Up / Down step (Shift and Alt change the step), Page Up / Page Down step by the coarse multiplier, Home and End jump to the limits. Enter commits, Escape reverts.
- The chip shows a focus ring while the input has focus.
- With `prefers-reduced-motion: reduce`, the chip does not lean and overshoots snap back without a spring.

- Ported from [React Bits](https://reactbits.dev/micro/scrub-field) by David Haz.
