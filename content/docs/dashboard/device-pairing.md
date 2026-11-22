---
title: Device Pairing
description: A pairing card with an isometric line-art stage, a six-cell LCD code input, a code countdown and a three-step progress row.
---

# Device Pairing

A card for pairing a home battery. The stage shows a line drawing of the battery and its solar panels, with rings pulsing from the battery while it waits. Type or paste the code from the device: each digit lights up in its LCD cell, the next cell glows, and Backspace steps back. When every cell is full, Pair (or Enter) starts pairing, the progress row moves on and the stage turns green. The countdown clears the code when a new one is due.

::demo-device-pairing
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/device-pairing.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import DevicePairing from '~/components/ui/device-pairing/DevicePairing.vue';
  import type { DevicePairingStatus } from '~/components/ui/device-pairing/types';

  const code = ref('');
  const status = ref<DevicePairingStatus>('idle');

  async function onPair(value: string): Promise<void> {
    const res = await fetch('/api/pair', { method: 'POST', body: value });
    status.value = res.ok ? 'paired' : 'error';
  }
</script>

<template>
  <DevicePairing
    v-model="code"
    v-model:status="status"
    :auto-confirm="0"
    @pair="onPair"
  />
</template>
```

With the default `auto-confirm` the card marks itself paired 1.4 s after Pair, which suits a demo. Set it to `0` and set `status` yourself once your backend answers. `'error'` shakes the cells and tints them red until the user edits the code.

The component exposes `pair()`, `reset()` and `focus()` through a template ref.

## Props

| Prop              | Type                                         | Default                       | Description                                                       |
| ----------------- | -------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| `model-value`     | `string`                                     | `''`                          | `v-model`. Typed digits.                                          |
| `status`          | `'idle' \| 'pairing' \| 'paired' \| 'error'` | `'idle'`                      | `v-model:status`. Where the flow is.                              |
| `length`          | `number`                                     | `6`                           | Number of code cells.                                             |
| `title`           | `string`                                     | `'Devices'`                   | Header title.                                                     |
| `subtitle`        | `string`                                     | `'Nothing paired yet'`        | Header subtitle before pairing.                                   |
| `paired-subtitle` | `string`                                     | `'Battery paired'`            | Header subtitle after pairing.                                    |
| `count`           | `number`                                     | `0`                           | Devices already paired, shown in the pill.                        |
| `icon`            | `string`                                     | `'lucide:plug'`               | Icon in the header chip.                                          |
| `stage-label`     | `string`                                     | `'Pairing'`                   | State label at the top left of the stage.                         |
| `nearby-label`    | `string`                                     | `'1 battery nearby'`          | Label at the top right of the stage.                              |
| `channel`         | `string`                                     | `'Ch 11 · 2.4 GHz'`           | Radio details at the bottom left of the stage.                    |
| `heading`         | `string`                                     | `'Pair your battery'`         | Heading above the code.                                           |
| `helper`          | `string`                                     | Two lines                     | Helper text. `\n` starts a new line.                              |
| `code-lifetime`   | `number`                                     | `120`                         | Seconds a code lives.                                             |
| `code-remaining`  | `number`                                     | `102`                         | Seconds left on the first code.                                   |
| `steps`           | `DevicePairingStep[]`                        | Power on, Enter code, Name it | Progress row labels. The second step is the code step.            |
| `auto-confirm`    | `number`                                     | `1400`                        | Milliseconds until the card sets itself paired. `0` turns it off. |
| `accent`          | `string`                                     | `'#ff9a2e'`                   | Lit digits, caret and pairing state.                              |
| `success-color`   | `string`                                     | `'#4ade80'`                   | Paired state.                                                     |
| `scan-label`      | `string`                                     | `'Scan QR code'`              | Text of the scan button.                                          |
| `pair-label`      | `string`                                     | `'Pair battery'`              | Text of the pair button.                                          |
| `class`           | `string`                                     | `''`                          | Extra classes for the root element.                               |

## Events

| Event               | Payload  | Description                                 |
| ------------------- | -------- | ------------------------------------------- |
| `update:modelValue` | `string` | The digits changed.                         |
| `update:status`     | `string` | The status changed.                         |
| `complete`          | `string` | Every cell is filled.                       |
| `pair`              | `string` | Pair or Enter was pressed with a full code. |
| `scan`              | —        | Scan QR code was pressed.                   |
| `expire`            | —        | The countdown ran out and the code cleared. |

## Accessibility

- One real text input sits over the cells, with `inputmode="numeric"` and `autocomplete="one-time-code"`, so typing, paste, Backspace and phone code autofill all work.
- The input is described by the countdown, and the stage state is an `aria-live` region.
- The progress row is a list and marks the current step with `aria-current="step"`.
- The pulsing rings, the cable flow and the caret blink stop when the user prefers reduced motion or the card is off screen.
