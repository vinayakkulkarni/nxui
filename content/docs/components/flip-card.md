---
title: Flip Card
description: Two-faced card that flips in 3D on a click, drag or flick and settles on a spring.
---

# Flip Card

A card with a front and a back that turns over in 3D. Click it, or press Enter or Space, to flip it. Drag it sideways to turn it by hand; on release it springs to the nearest face and keeps the speed of a flick, so a fast swipe can carry it all the way round. On hover it leans toward the cursor, lifts a little and a soft sheen follows the pointer. The shadow underneath narrows as the card turns edge on.

::demo-flip-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flip-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import FlipCard from '~/components/ui/flip-card/FlipCard.vue';

  const flipped = ref(false);
</script>

<template>
  <FlipCard v-model:flipped="flipped" aria-label="Wooded Landscape">
    <template #front>
      <img
        src="/landscape.jpg"
        alt="Wooded Landscape"
        class="size-full object-cover"
      />
    </template>
    <template #back>
      <div class="flex h-full flex-col justify-between p-7">
        <span class="text-2xl font-medium">Wooded Landscape</span>
        <span class="text-sm opacity-70">17th century</span>
      </div>
    </template>
  </FlipCard>
</template>
```

Leave out `flipped` and the card keeps its own state; use `default-flipped` to start on the back.

## Props

| Prop              | Type         | Default       | Description                                                                                             |
| ----------------- | ------------ | ------------- | ------------------------------------------------------------------------------------------------------- |
| `flipped`         | `boolean`    | —             | Controlled state, also `v-model:flipped`. `true` shows the back. Omit it to let the card manage itself. |
| `default-flipped` | `boolean`    | `false`       | Start on the back face.                                                                                 |
| `axis`            | `'y' \| 'x'` | `'y'`         | `y` turns the card sideways and drags horizontally. `x` turns it over the top and drags vertically.     |
| `flip-on-click`   | `boolean`    | `true`        | A press without movement flips the card.                                                                |
| `draggable`       | `boolean`    | `true`        | Drag to turn the card by hand. On release it springs to the nearest face, carrying the flick speed.     |
| `drag-distance`   | `number`     | `0`           | Pixels of drag for a half turn. `0` uses the card width, or its height on the `x` axis.                 |
| `tilt`            | `boolean`    | `true`        | The card leans toward the cursor on hover.                                                              |
| `tilt-max`        | `number`     | `12`          | Largest tilt angle in degrees.                                                                          |
| `glare`           | `boolean`    | `true`        | A soft sheen that follows the cursor.                                                                   |
| `glare-opacity`   | `number`     | `0.22`        | Strength of the sheen at its centre.                                                                    |
| `hover-scale`     | `number`     | `1.03`        | Lift while hovered or held.                                                                             |
| `perspective`     | `number`     | `1100`        | Viewing distance in px. Smaller is more dramatic.                                                       |
| `stiffness`       | `number`     | `170`         | Stiffness of the flip spring.                                                                           |
| `damping`         | `number`     | `20`          | Damping of the flip spring. Lower overshoots more.                                                      |
| `width`           | `number`     | `300`         | Card width in px, capped at the parent.                                                                 |
| `height`          | `number`     | `400`         | Card height in px.                                                                                      |
| `radius`          | `number`     | `22`          | Corner radius in px.                                                                                    |
| `background`      | `string`     | `'#27272a'`   | Surface of both faces. Also exposed to the faces as `--fc-bg`.                                          |
| `color`           | `string`     | `'#f5f5f5'`   | Text colour of both faces.                                                                              |
| `shadow`          | `boolean`    | `true`        | A soft shadow beneath the card that narrows as it turns edge on.                                        |
| `shadow-color`    | `string`     | `'#000000'`   | Shadow colour.                                                                                          |
| `shadow-opacity`  | `number`     | `0.45`        | Shadow strength.                                                                                        |
| `disabled`        | `boolean`    | `false`       | Dimmed, flat and inert.                                                                                 |
| `aria-label`      | `string`     | `'Flip card'` | Accessible name. The face shown is carried by `aria-pressed`.                                           |
| `class`           | `string`     | `''`          | Extra classes for the root.                                                                             |

## Slots and events

| Name                   | Payload   | Description                                                       |
| ---------------------- | --------- | ----------------------------------------------------------------- |
| `front` slot           | —         | Content of the front face.                                        |
| `back` slot            | —         | Content of the back face.                                         |
| `update:flipped` event | `boolean` | Fires when a click, drag, flick or key lands on the other face.   |
| `flip-change` event    | `boolean` | Same as `update:flipped`, for listeners that don't use `v-model`. |

## Accessibility

- The card is a `role="button"` with `aria-pressed` set while the back is shown.
- Enter and Space flip it. Focus shows a visible ring.
- The hidden face is `inert` and `aria-hidden`, so its links and text are skipped.
- With `prefers-reduced-motion: reduce`, the faces cross-fade instead of turning, and tilt, lift and drag are off.

- Ported from [React Bits](https://reactbits.dev/micro/flip-card) by David Haz.
