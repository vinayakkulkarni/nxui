---
title: Option Wheel
description: Curved option picker that spins with scroll, drag or arrow keys, tilting items away.
---

# Option Wheel

A list of options laid out on a curve, like the edge of a dial. The option in the middle is selected; the others tilt away, fade and blur with distance. Scroll, drag up and down, click an option or use the arrow keys to turn it. An optional tick sound plays on every change.

::demo-option-wheel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/option-wheel.json"
```

## Usage

```vue
<script setup lang="ts">
  import OptionWheel from '~/components/ui/option-wheel/OptionWheel.vue';

  function onChange(index: number, item: string) {
    console.log(index, item);
  }
</script>

<template>
  <div class="relative h-125 w-full">
    <OptionWheel
      :items="['Ambient', 'House', 'Techno', 'Jazz', 'Lo-Fi', 'Synthwave']"
      :default-selected="3"
      side="left"
      :tilt="6"
      sound-url="/sounds/click-soft.mp3"
      @change="onChange"
    />
  </div>
</template>
```

The wheel fills its container, so give the parent a height. One rAF loop eases the position toward its target and only runs while the wheel is moving.

## Props

| Prop               | Type                | Default         | Description                                                          |
| ------------------ | ------------------- | --------------- | -------------------------------------------------------------------- |
| `items`            | `string[]`          | 12 music genres | Labels rendered as the wheel options.                                |
| `default-selected` | `number`            | `3`             | Index of the option selected on mount.                               |
| `text-color`       | `string`            | `'#a6a6a6'`     | Resting color of the option labels.                                  |
| `active-color`     | `string`            | `'#ffffff'`     | Color an option blends toward as it reaches the middle.              |
| `side`             | `'left' \| 'right'` | `'left'`        | Edge of the container the wheel curves around.                       |
| `font-size`        | `number`            | `3`             | Font size of the labels in rem.                                      |
| `spacing`          | `number`            | `1.4`           | Distance between options as a multiple of the font size.             |
| `curve`            | `number`            | `1`             | Depth of the curve; 0 flattens the wheel into a straight list.       |
| `tilt`             | `number`            | `6`             | Angle in degrees between neighbouring options; higher curls tighter. |
| `blur`             | `number`            | `2`             | Blur in px added per step away from the middle.                      |
| `fade`             | `number`            | `0.25`          | Opacity lost per step away from the middle.                          |
| `min-opacity`      | `number`            | `0.05`          | Opacity floor for the furthest options.                              |
| `smoothing`        | `number`            | `200`           | Easing time constant in ms; higher values feel heavier.              |
| `inset`            | `number`            | `80`            | Padding in px between the anchored edge and the options.             |
| `loop`             | `boolean`           | `false`         | Wrap around instead of stopping at the first and last option.        |
| `draggable`        | `boolean`           | `true`          | Allow dragging with a pointer, in addition to scroll and keys.       |
| `sound-url`        | `string`            | `''`            | URL of a short tick played when the selection changes; empty = off.  |
| `sound-volume`     | `number`            | `0.5`           | Playback volume of the tick, from 0 to 1.                            |
| `class`            | `string`            | `''`            | Extra classes on the root.                                           |

## Events

| Event    | Payload                         | Description                      |
| -------- | ------------------------------- | -------------------------------- |
| `change` | `(index: number, item: string)` | The wheel moved to a new option. |

## Accessibility

- The root is a focusable `listbox`; each label is an `option` with `aria-selected` on the middle one.
- Arrow Up / Left and Arrow Down / Right step one option. The focused wheel shows a ring in the active color.
- With `prefers-reduced-motion: reduce`, the wheel jumps to each option instead of easing.
- The tick sound is off unless you pass `sound-url`, and playback failures (autoplay policies) are ignored.

- Ported from [React Bits](https://reactbits.dev/components/option-wheel) by David Haz.
