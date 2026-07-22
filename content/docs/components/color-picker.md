---
title: Color Picker
description: A color swatch that blooms into a radial rosette of hue and pastel petals with a vertical lightness arc.
---

::demo-color-picker
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/color-picker.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ColorPicker from '~/components/ui/color-picker/ColorPicker.vue';

  const color = ref('#e8b64c');
</script>

<template>
  <ColorPicker v-model="color" />
</template>
```

Click the swatch to bloom the rosette: an outer ring of saturated hue petals,
an inner ring of pastels, and a center swatch showing the current color. Click
any petal to pick its hue, then drag the vertical arc on the right to set
lightness. `v-model` stays in sync as a hex string. Set `:open-on-hover="true"`
to bloom on hover instead of click.

## Props

| Prop            | Type      | Default     | Description                                      |
| --------------- | --------- | ----------- | ------------------------------------------------ |
| `model-value`   | `string`  | `'#e8b64c'` | Two-way bound hex color                          |
| `size`          | `number`  | `56`        | Diameter of the closed swatch button, in px      |
| `hue-count`     | `number`  | `16`        | Number of saturated hue petals in the outer ring |
| `open-on-hover` | `boolean` | `false`     | Bloom on hover instead of click                  |

## Events

| Event               | Payload         | Description                          |
| ------------------- | --------------- | ------------------------------------ |
| `update:modelValue` | `value: string` | Fired as the color changes (v-model) |
| `change`            | `value: string` | Fired when a new color is committed  |

## Credits

Inspired by the color picker interaction by [@nexvyn](https://x.com/nexvyn).
