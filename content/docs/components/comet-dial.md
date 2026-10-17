---
title: Comet Dial
description: Circular dial you set by angle. A comet trail streaks behind the lit head when it moves fast, and a flick carries the value on.
---

Press anywhere on the ring and drag around it to set the value. The reading follows on a spring, and a comet trail grows behind the bead with its speed. Flick and let go to carry the value past where you released. Arrow keys, Page Up, Page Down, Home and End also work.

::demo-comet-dial
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/comet-dial.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import CometDial from '~/components/ui/comet-dial/CometDial.vue';

  const level = ref(62);
</script>

<template>
  <CometDial v-model="level" unit="%" label="Level" :comet-reach="180" />
</template>
```

## Props

| Prop            | Type      | Default     | Description                                                                 |
| --------------- | --------- | ----------- | --------------------------------------------------------------------------- |
| `model-value`   | `number`  | —           | Controlled value (`v-model`). A change from outside springs the reading.    |
| `default-value` | `number`  | `62`        | Initial value when uncontrolled.                                            |
| `min`           | `number`  | `0`         | Lowest value.                                                               |
| `max`           | `number`  | `100`       | Highest value.                                                              |
| `step`          | `number`  | `1`         | Snapping grid, and the keyboard nudge.                                      |
| `unit`          | `string`  | `'%'`       | Suffix after the figure. Empty hides it.                                    |
| `label`         | `string`  | `'Level'`   | Accessible name of the slider.                                              |
| `accent`        | `string`  | `'#f5f5f5'` | The lit arc, the bead and the comet.                                        |
| `ink`           | `string`  | `'#fdfdfd'` | The track and the readout.                                                  |
| `size`          | `number`  | `250`       | Diameter in pixels. Everything inside scales with it.                       |
| `sweep`         | `number`  | `320`       | Degrees the arc covers, with the gap centred at the bottom.                 |
| `thickness`     | `number`  | `5`         | Stroke width of the track and the arc. The bead follows it.                 |
| `speed`         | `number`  | `25`        | How quickly the reading arrives, 0 to 100.                                  |
| `tap-bounce`    | `number`  | `0.2`       | Ring-down after a tap. `0` stops dead.                                      |
| `flick-bounce`  | `number`  | `0.1`       | Ring-down after a full-speed flick. A slower release lands between the two. |
| `momentum`      | `number`  | `1`         | How far a flick carries past where you let go. `0` drops it there.          |
| `comet-reach`   | `number`  | `180`       | Degrees of trail behind the bead at full speed.                             |
| `comet-width`   | `number`  | `12`        | Extra stroke width at the head of the trail at full speed.                  |
| `disabled`      | `boolean` | `false`     | Dims the dial and ignores input.                                            |
| `class`         | `string`  | `''`        | Extra classes for the root element.                                         |

## Events

| Name                 | Payload                               | Description                                        |
| -------------------- | ------------------------------------- | -------------------------------------------------- |
| `update:model-value` | `value: number`                       | Fires on every snapped change, including mid-drag. |
| `change-end`         | `value: number, { velocity, bounce }` | Fires on release and on a key press.               |

## Accessibility

- The ring is a focusable `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext`.
- Arrow keys step by `step` (Shift steps by ten), Page Up and Page Down step by ten, Home and End jump to the ends.
- The centre of the dial is a dead zone, so a press there does nothing.
- With reduced motion, the reading jumps to the value and no comet is drawn.

- Ported from [React Bits](https://reactbits.dev/micro/comet-dial) by David Haz.
