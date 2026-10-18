---
title: Squish Switch
description: Switch whose thumb stretches with speed and squashes against the end when you flick it.
---

# Squish Switch

A toggle switch with a soft, physical thumb. Click or tap it to flip, or grab the thumb and drag it: it follows your pointer, commits once it passes the middle, and springs to the end when you let go. The thumb lengthens with its speed and narrows to keep its area, so a quick flick stretches it and the stop squashes it back. It swells a little on hover. Press Escape during a drag to cancel, and Space or Enter to toggle from the keyboard.

::demo-squish-switch
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/squish-switch.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import SquishSwitch from '~/components/ui/squish-switch/SquishSwitch.vue';

  const airplane = ref(false);
</script>

<template>
  <SquishSwitch
    v-model="airplane"
    label="Airplane mode"
    :speed="50"
    :stretch="36"
  />
</template>
```

Leave out `v-model` to let the switch keep its own state (seeded by `default-checked`) and listen to `@change`.

## Props

| Prop              | Type      | Default     | Description                                                            |
| ----------------- | --------- | ----------- | ---------------------------------------------------------------------- |
| `model-value`     | `boolean` | `undefined` | Controlled state (`v-model`). Leave it out to keep internal state.     |
| `default-checked` | `boolean` | `false`     | Initial state when uncontrolled.                                       |
| `label`           | `string`  | `''`        | A label beside the switch, wired to it.                                |
| `disabled`        | `boolean` | `false`     | Dimmed and inert.                                                      |
| `track-color`     | `string`  | `'#27272a'` | The track while off.                                                   |
| `track-on-color`  | `string`  | `'#f5f5f5'` | The track while on.                                                    |
| `thumb-color`     | `string`  | `''`        | The thumb while off. Empty mixes the on colour faintly into the track. |
| `thumb-on-color`  | `string`  | `''`        | The thumb while on. Empty uses the off track colour.                   |
| `width`           | `number`  | `76`        | Track width in px.                                                     |
| `height`          | `number`  | `38`        | Track height in px. The thumb and its inset follow.                    |
| `radius`          | `number`  | `19`        | Track corner radius in px, capped at half the height.                  |
| `speed`           | `number`  | `50`        | Stiffness of the settle spring, 0 to 100. Low is lazy, high is snappy. |
| `stretch`         | `number`  | `36`        | How much the thumb lengthens with speed, 0 to 100.                     |
| `hover-scale`     | `number`  | `1.035`     | The thumb swells to this on hover.                                     |
| `color-duration`  | `number`  | `320`       | The colour cross-fade, in ms.                                          |
| `aria-label`      | `string`  | —           | Accessible name when there is no label.                                |
| `id`              | `string`  | auto        | Id for the switch button; the label uses it.                           |
| `class`           | `string`  | `''`        | Extra classes for the root element.                                    |

## Events

| Event               | Payload            | Description                              |
| ------------------- | ------------------ | ---------------------------------------- |
| `update:modelValue` | `checked: boolean` | A tap, a drag past the middle, or a key. |
| `change`            | `checked: boolean` | Same moment as `update:modelValue`.      |

## Accessibility

- It is a native `button` with `role="switch"` and `aria-checked`, so Space and Enter toggle it.
- The `label` is a real `<label for>`; clicking it toggles the switch. Use `aria-label` when there is no visible label.
- A focus ring shows on keyboard focus. Escape cancels a drag and restores the state from the press.
- With `prefers-reduced-motion`, the thumb jumps to its end, does not stretch, and colours change at once.

- Ported from [React Bits](https://reactbits.dev/micro/squish-switch) by David Haz.
