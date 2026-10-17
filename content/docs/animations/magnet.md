---
title: Magnet
description: Elements ease toward the cursor on a real spring, with tilt, scale, axis locking and a movement cap. Only the nearest magnet reacts when several overlap.
---

Move the cursor near the element and it leans toward it on a spring, with a smooth pull that fades in at the edge of its range. It can tilt in 3D, grow a little, stay on one axis or stop at a maximum offset. When several magnets overlap, only the nearest one moves, unless you turn off `exclusive` so a group (like dock icons) leans together. Switch scenes and presets in the panel.

::demo-magnet
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magnet.json"
```

## Usage

```vue
<script setup lang="ts">
  import Magnet from '~/components/ui/magnet/Magnet.vue';
</script>

<template>
  <Magnet
    :padding="100"
    :magnet-strength="2"
    :tilt="6"
    :max-offset="10"
    :spring="{ stiffness: 170, damping: 16 }"
  >
    <button
      type="button"
      class="h-11 rounded-xl bg-primary px-5 text-primary-foreground"
    >
      Get started
    </button>
  </Magnet>
</template>
```

## Props

| Prop              | Type                                                      | Default                                    | Description                                                                                            |
| ----------------- | --------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `padding`         | `number`                                                  | `100`                                      | Distance in px around the element where the cursor starts to pull it.                                  |
| `magnet-strength` | `number`                                                  | `2`                                        | The cursor offset is divided by this value, so 1 follows the cursor and higher values move less.       |
| `exclusive`       | `boolean`                                                 | `true`                                     | When several magnets are in range, only the nearest exclusive one is pulled. Turn off for groups.      |
| `axis`            | `'both' \| 'x' \| 'y'`                                    | `'both'`                                   | Limits the movement to one axis.                                                                       |
| `max-offset`      | `number`                                                  | `-`                                        | Caps how far the element can move from its resting place, in px.                                       |
| `tilt`            | `number`                                                  | `0`                                        | Maximum 3D tilt toward the cursor, in degrees.                                                         |
| `scale`           | `number`                                                  | `1`                                        | Scale of the element while the cursor pulls it.                                                        |
| `spring`          | `{ stiffness?: number; damping?: number; mass?: number }` | `{ stiffness: 170, damping: 16, mass: 1 }` | Spring that drives the movement. Higher stiffness reacts faster, lower damping overshoots and wobbles. |
| `disabled`        | `boolean`                                                 | `false`                                    | Turns the effect off and lets the element spring back to rest.                                         |
| `class`           | `string`                                                  | `''`                                       | Classes for the outer wrapper, which stays in place.                                                   |
| `inner-class`     | `string`                                                  | `''`                                       | Classes for the inner element that moves.                                                              |

## Events

| Event           | Payload           | Description                                                                                                       |
| --------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `active-change` | `active: boolean` | Fires when the cursor enters or leaves the magnetic area. The wrapper also gets a `data-magnet-active` attribute. |

## Slots

| Slot      | Description                               |
| --------- | ----------------------------------------- |
| `default` | The content that moves toward the cursor. |

## Accessibility

- The wrapper adds no roles or focus stops; your slotted button or link keeps its own semantics and focus ring.
- Touch pointers are ignored, so taps never shift a target out from under a finger.
- With `prefers-reduced-motion: reduce` the element stays still.
- All magnets share one pointer listener, and each spring loop stops once it is at rest.

- Ported from [React Bits](https://reactbits.dev/animations/magnet) by David Haz.
