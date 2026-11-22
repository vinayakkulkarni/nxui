---
title: Thermal Dial
description: A thermostat card you set by turning its dial. The heat at its foot shifts from cold blue through amber to summer red as the reading changes.
---

# Thermal Dial

A temperature card you set by turning its dial. Drag round the ring, scroll over the card, or focus it and use the arrow keys. The reading follows on a spring that overshoots and settles, the lit ticks carry a slow travelling wave with a brighter head, and the heat at the foot of the card rises and changes colour with the number: cold blue in winter, cyan in autumn, amber in spring and red in summer. The digits roll one slot at a time and the season above them swaps letter by letter through a blur.

::demo-thermal-dial
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/thermal-dial.json"
```

## Usage

```vue
<script setup lang="ts">
  import { computed, ref } from 'vue';
  import ThermalDial from '~/components/ui/thermal-dial/ThermalDial.vue';
  import type { ThermalDialSeason } from '~/components/ui/thermal-dial/types';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));
  const temp = ref(22);

  function onChange(value: number, season: ThermalDialSeason) {
    console.log(value, season);
  }
</script>

<template>
  <ThermalDial v-model="temp" :theme="theme" @change="onChange" />
</template>
```

On mount the card fades in and the reading sweeps up from `min` to its value. `v-model` is optional; without it the dial starts at `default-value` and keeps its own reading. The seasons are fixed bands: below 5° is Winter, below 16° Autumn, below 26° Spring, and 26° and up Summer.

## Props

| Prop            | Type                | Default         | Description                                                          |
| --------------- | ------------------- | --------------- | -------------------------------------------------------------------- |
| `model-value`   | `number`            | —               | `v-model`. The reading in whole degrees, clamped to `min`–`max`.     |
| `default-value` | `number`            | `38`            | The reading it settles on after the opening sweep when no `v-model`. |
| `min`           | `number`            | `-9`            | Lowest reading, at the left end of the arc.                          |
| `max`           | `number`            | `70`            | Highest reading, at the right end of the arc.                        |
| `size`          | `number`            | `340`           | Card width in px. It never exceeds 80% of the viewport width.        |
| `theme`         | `'light' \| 'dark'` | `'dark'`        | Colour theme. Pass your site's colour mode.                          |
| `hint`          | `boolean`           | `true`          | Shows a line under the card saying how to use it.                    |
| `label`         | `string`            | `'Temperature'` | Accessible name of the slider.                                       |
| `class`         | `string`            | `''`            | Extra classes for the root element.                                  |

## Events

| Event               | Payload                                      | Description                                          |
| ------------------- | -------------------------------------------- | ---------------------------------------------------- |
| `change`            | `(value: number, season: ThermalDialSeason)` | Fires when the user sets a new reading.              |
| `update:modelValue` | `(value: number)`                            | `v-model` update, fired with every new whole degree. |

## Accessibility

- The card is a `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and an `aria-valuetext` such as "22 degrees, Spring". The digits and season label are hidden from assistive tech because the slider already speaks them.
- Arrow Up and Right raise the reading by one degree, Down and Left lower it, Shift steps by five, Home and End jump to the ends of the scale. The mouse wheel steps one degree.
- The card shows a focus ring on its rim when focused from the keyboard.
- With reduced motion the reading jumps straight to its value, the digits and letters swap without rolling or blurring, and the wave and breathing stop.

Ported from [Thermal Dial](https://pinui.xyz/components/thermal-dial) by Pin UI, MIT licence.
