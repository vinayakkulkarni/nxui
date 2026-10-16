---
title: Code Slots
description: One-time code input whose digits spring into their slots, with paste and SMS autofill.
---

# Code Slots

A one-time code field. Each digit springs into its slot as a filled tile, and the caret glides along behind it. Paste or SMS autofill drops the whole code in with a short cascade. Set `status` to `error` and the digits drain out last to first under the danger tint, then the code clears; set it to `success` and the tiles merge into one wash with a check. Click a slot to move the caret there; Backspace, Delete, the arrow keys, Home and End work as in a text field. In the demo, fill all six slots to see the outcome picked in the panel.

::demo-code-slots
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/code-slots.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import CodeSlots from '~/components/ui/code-slots/CodeSlots.vue';
  import type { CodeSlotsStatus } from '~/components/ui/code-slots/types';

  const code = ref('');
  const status = ref<CodeSlotsStatus>('idle');

  async function verify(value: string) {
    const ok = await fetch('/api/verify', { method: 'POST', body: value }).then(
      (r) => r.ok,
    );
    status.value = ok ? 'success' : 'error';
  }
</script>

<template>
  <CodeSlots
    v-model="code"
    :length="6"
    :status="status"
    @change="status = 'idle'"
    @complete="verify"
  />
</template>
```

## Props

| Prop            | Type                             | Default           | Description                                                                                                                                     |
| --------------- | -------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `length`        | `number`                         | `6`               | Number of slots.                                                                                                                                |
| `model-value`   | `string`                         | `undefined`       | Controlled code (`v-model`). Digits that arrive from outside land with the cascade; digits removed drain.                                       |
| `default-value` | `string`                         | `''`              | Uncontrolled initial code, rendered already landed.                                                                                             |
| `status`        | `'idle' \| 'error' \| 'success'` | `'idle'`          | `error` drains the slots last to first under the danger tint and clears the code; `success` merges the fills into one wash and locks the input. |
| `mask`          | `boolean`                        | `false`           | Shows a dot instead of each digit.                                                                                                              |
| `caret`         | `boolean`                        | `true`            | Shows the blinking caret in the active slot.                                                                                                    |
| `disabled`      | `boolean`                        | `false`           | Fades the row and ignores input.                                                                                                                |
| `auto-focus`    | `boolean`                        | `false`           | Focuses the input on mount.                                                                                                                     |
| `accent-color`  | `string`                         | `'#f5f5f5'`       | Fill of a landed digit and the success wash.                                                                                                    |
| `ink-color`     | `string`                         | `'#f5f5f5'`       | Caret, and the tint of the active slot.                                                                                                         |
| `slot-color`    | `string`                         | `'#27272a'`       | Surface of an empty slot.                                                                                                                       |
| `digit-color`   | `string`                         | `'#18181b'`       | Digit colour on the fill.                                                                                                                       |
| `danger-color`  | `string`                         | `'#ff3b30'`       | Fill and tint colour while `status` is `error`.                                                                                                 |
| `slot-size`     | `number`                         | `44`              | Slot width in px. Height and digit size follow it.                                                                                              |
| `gap`           | `number`                         | `8`               | Space between slots in px.                                                                                                                      |
| `radius`        | `number`                         | `12`              | Corner radius in px, capped at half the slot size.                                                                                              |
| `bounce`        | `number`                         | `0.2`             | Spring overshoot of the landing fill. `0` is critically damped.                                                                                 |
| `settle`        | `number`                         | `0.3`             | Seconds a digit takes to land or drain.                                                                                                         |
| `rise`          | `number`                         | `8`               | Pixels a digit rises into place. `0` fades only.                                                                                                |
| `cascade`       | `number`                         | `20`              | Milliseconds between slots when several land at once or drain on reject.                                                                        |
| `aria-label`    | `string`                         | `'One-time code'` | Accessible name of the input.                                                                                                                   |
| `class`         | `string`                         | `''`              | Extra classes for the root.                                                                                                                     |

## Events

| Event               | Payload          | Description                                             |
| ------------------- | ---------------- | ------------------------------------------------------- |
| `update:modelValue` | `(code: string)` | Every edit, for `v-model`.                              |
| `change`            | `(code: string)` | Every edit, including the clear at the end of a reject. |
| `complete`          | `(code: string)` | Once, when the last empty slot is filled.               |

## Accessibility

- One real `<input>` sits over the slots with `inputmode="numeric"` and `autocomplete="one-time-code"`, so iOS and Android offer the SMS code, and screen readers see a single text field.
- `aria-invalid` follows the error status, and a polite live region announces "N of 6 digits entered" or "Code accepted".
- With `prefers-reduced-motion: reduce` digits appear without the spring, rise or cascade, and the caret stops blinking.

- Ported from [React Bits](https://reactbits.dev/micro/code-slots) by David Haz.
