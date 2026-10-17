---
title: Slosh Gauge
description: Tank gauge whose liquid chases the value, tilts as it moves and splashes when it fills.
---

A tank gauge filled with liquid that chases its value on a spring. The surface leans while it moves, overshoots, and splashes back off the top or bottom when it slams in. Make it `interactive` to press or drag the tank to set the level, or step it with the arrow keys.

::demo-slosh-gauge
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/slosh-gauge.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import SloshGauge from '~/components/ui/slosh-gauge/SloshGauge.vue';

  const level = ref(60);
</script>

<template>
  <SloshGauge
    v-model="level"
    interactive
    liquid-color="#f5f5f5"
    glass-color="#27272a"
    :viscosity="0.15"
    :tilt="0.45"
    :splash="0.42"
  />
</template>
```

Without `interactive`, the gauge is a read-only `meter` that animates whenever `model-value` changes. Without `v-model`, it starts at `default-value`.

## Props

| Prop            | Type      | Default     | Description                                                                              |
| --------------- | --------- | ----------- | ---------------------------------------------------------------------------------------- |
| `model-value`   | `number`  | `undefined` | The level, 0 to 100 (use `v-model`). Every change launches the liquid toward it.         |
| `default-value` | `number`  | `60`        | The starting level when uncontrolled.                                                    |
| `interactive`   | `boolean` | `false`     | Press or drag the tank to set the level, arrows to step. A marker shows the level.       |
| `show-value`    | `boolean` | `true`      | A readout whose colour flips at the surface.                                             |
| `disabled`      | `boolean` | `false`     | Dimmed and inert. Value changes still animate.                                           |
| `liquid-color`  | `string`  | `'#f5f5f5'` | The liquid. The readout over it picks dark or light by itself.                           |
| `glass-color`   | `string`  | `'#27272a'` | The tank.                                                                                |
| `width`         | `number`  | `88`        | Tank width in px. The readout scales with it.                                            |
| `height`        | `number`  | `180`       | Tank height in px.                                                                       |
| `radius`        | `number`  | `20`        | Corner radius in px, capped at half the smaller side.                                    |
| `ticks`         | `number`  | `4`         | Lines etched on the right of the glass. `0` hides them.                                  |
| `viscosity`     | `number`  | `0.15`      | `0` is a rigid gauge. Higher is slower to answer, longer to settle, and overshoots more. |
| `tilt`          | `number`  | `0.45`      | How far the surface leans per unit of speed. `0` keeps it flat.                          |
| `splash`        | `number`  | `0.42`      | How much of a slam the top and bottom give back. `0` swallows it, `0.8` nearly bounces.  |
| `unit`          | `string`  | `'%'`       | Readout suffix.                                                                          |
| `aria-label`    | `string`  | `'Level'`   | Accessible name of the meter or slider.                                                  |
| `class`         | `string`  | `''`        | Extra classes for the tank.                                                              |

## Events

| Event               | Payload  | Description                                                             |
| ------------------- | -------- | ----------------------------------------------------------------------- |
| `update:modelValue` | `number` | The integer level on press, on each change while dragging, and on keys. |
| `change`            | `number` | Same as above, for listeners that do not use `v-model`.                 |

## Accessibility

- Read-only gauges are a `meter`; interactive ones are a vertical `slider` with `aria-valuenow` kept in sync with the level.
- Arrow keys step by 2 (10 with Shift), Page Up and Page Down step by 10, Home and End jump to 0 and 100.
- Escape during a drag puts the level back where the drag started.
- Grabbing near the current level drags it relatively; pressing elsewhere jumps to that point.
- With `prefers-reduced-motion`, the surface stays flat, the spring is critically damped and nothing splashes.

- Ported from [React Bits](https://reactbits.dev/micro/slosh-gauge) by David Haz.
