---
title: Jelly Radio
description: Radio group of chips where the chosen one swells and barges its neighbours outward.
---

A radio group drawn as a row of chips. Click a chip and it swells, stretching wide before tall like jelly, while its neighbours get shoved outward in a staggered ripple. Arrow keys move the choice and jump straight to it.

::demo-jelly-radio
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/jelly-radio.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import JellyRadio from '~/components/ui/jelly-radio/JellyRadio.vue';
  import type { JellyRadioItem } from '~/components/ui/jelly-radio';

  const level = ref('Medium');
  const theme = ref('system');
  const themes: JellyRadioItem[] = [
    { value: 'light', label: 'Light', icon: 'lucide:sun' },
    { value: 'dark', label: 'Dark', icon: 'lucide:moon' },
    { value: 'system', label: 'System', icon: 'lucide:monitor' },
  ];
</script>

<template>
  <JellyRadio
    v-model="level"
    :items="['Off', 'Low', 'Medium', 'High', 'Max']"
  />
  <JellyRadio v-model="theme" :items="themes" size="lg" aria-label="Theme" />
</template>
```

Every chip runs three springs: one for its shift and one per scale axis. The horizontal scale is stiffer and bouncier than the vertical one, which starts 50 ms later scaled by `jelly`, so the chosen chip widens before it grows tall. Neighbours start `stagger` ms later per step away and soften their stiffness with distance.

## Props

| Prop                | Type                      | Default                                   | Description                                                                                                       |
| ------------------- | ------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `items`             | `JellyRadioItem[]`        | `['Off', 'Low', 'Medium', 'High', 'Max']` | The chips. A string is both value and label; objects take `value`, `label`, `icon` (Iconify name) and `disabled`. |
| `model-value`       | `string`                  | —                                         | Controlled value (`v-model`). Outside changes jump.                                                               |
| `default-value`     | `string`                  | first item                                | Initial value when uncontrolled.                                                                                  |
| `chip-color`        | `string`                  | `'var(--muted)'`                          | Surface of an unchosen chip.                                                                                      |
| `active-color`      | `string`                  | `'var(--foreground)'`                     | Surface of the chosen chip.                                                                                       |
| `text-color`        | `string`                  | `'var(--foreground)'`                     | Label of an unchosen chip, and the hover tone.                                                                    |
| `active-text-color` | `string`                  | `'var(--background)'`                     | Label of the chosen chip.                                                                                         |
| `size`              | `'sm' \| 'md' \| 'lg'`    | `'md'`                                    | Chip height 28, 36 or 44 pixels. Large is the touch-first size.                                                   |
| `gap`               | `number`                  | `8`                                       | Rest spacing between chips in pixels.                                                                             |
| `radius`            | `number`                  | `18`                                      | Corner radius in pixels. 18 is a pill at medium.                                                                  |
| `swell`             | `number`                  | `0.2`                                     | How much the chosen chip grows. It also sets the room the neighbours make.                                        |
| `barge`             | `number`                  | `6`                                       | Extra pixels every neighbour is shoved beyond that room. 0 only makes room.                                       |
| `shrink`            | `number`                  | `0.05`                                    | How much every unchosen chip gives up.                                                                            |
| `jelly`             | `number`                  | `1`                                       | The wide-before-tall split. 0 swells uniformly, 1.5 exaggerates it.                                               |
| `bounce`            | `number`                  | `0.25`                                    | One minus the damping ratio. 0 arrives and stops, 0.4 rings.                                                      |
| `stagger`           | `number`                  | `22`                                      | Milliseconds per row step before a neighbour moves. 0 moves the row as a slab.                                    |
| `stiffness`         | `number`                  | `580`                                     | Spring stiffness of the chosen chip. Neighbours soften with distance.                                             |
| `disabled`          | `boolean`                 | `false`                                   | Fades the group and ignores input.                                                                                |
| `aria-label`        | `string`                  | `'Options'`                               | Accessible name of the group.                                                                                     |
| `class`             | `HTMLAttributes['class']` | —                                         | Extra classes for the group.                                                                                      |

## Events

| Event               | Payload                          | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `update:modelValue` | `(value: string)`                | Fired on the commit, before the motion ends. |
| `change`            | `(value: string, index: number)` | Same commit, with the chip index.            |

## Accessibility

- `role="radiogroup"` with `role="radio"` chips and `aria-checked`; only the chosen chip is in the tab order (roving tabindex).
- Arrow keys move the choice and skip disabled chips, wrapping at the ends. Home and End jump to the first and last enabled chip. Keyboard choices jump without the spring.
- Keyboard focus draws a ring around the chip.
- With `prefers-reduced-motion: reduce` every change jumps.

- Ported from [React Bits](https://reactbits.dev/micro/jelly-radio) by David Haz.
