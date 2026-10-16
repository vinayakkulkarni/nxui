---
title: Call Chip
description: Tool-call chip whose fill wipes across as a live timer ticks, ending green or shaking red.
---

# Call Chip

A compact chip for an agent's tool call. While the call runs, a soft fill wipes across the chip and a millisecond counter ticks. The fill parks at 90% until the call resolves. On success the fill completes, washes green and the tool glyph rolls into a check. On failure the fill stops where it was, tints red and the chip shakes. When you bind `@retry`, the failed chip becomes a button: click it (or focus it and press Enter) to run the call again. Press Replay in the demo panel to restart.

::demo-call-chip
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/call-chip.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import CallChip from '~/components/ui/call-chip/CallChip.vue';
  import type { CallChipStatus } from '~/components/ui/call-chip/types';

  const status = ref<CallChipStatus>('running');

  function runTool() {
    status.value = 'running';
    setTimeout(() => {
      status.value = 'done';
    }, 1400);
  }
</script>

<template>
  <CallChip
    icon="terminal"
    name="bash"
    argument="npm test"
    :status="status"
    :expected-ms="2500"
    @retry="runTool"
  />
</template>
```

## Props

| Prop               | Type                                                   | Default          | Description                                                                                                 |
| ------------------ | ------------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `icon`             | `'terminal' \| 'file' \| 'search' \| 'edit' \| string` | `'terminal'`     | Tool glyph preset or any Iconify name. It rolls out when the call resolves.                                 |
| `name`             | `string`                                               | `'bash'`         | The tool name.                                                                                              |
| `argument`         | `string`                                               | `'npm test'`     | The argument.                                                                                               |
| `status`           | `'idle' \| 'running' \| 'done' \| 'error'`             | `'running'`      | Running wipes the fill and ticks the counter. Done completes it with a wash. Error stops, tints and shakes. |
| `expected-ms`      | `number`                                               | `2500`           | Milliseconds the fill takes to reach its 90% park — the time you expect the call to take.                   |
| `size`             | `number`                                               | `34`             | Chip height in pixels. Font, padding and glyph follow.                                                      |
| `radius`           | `number`                                               | `10`             | Corner radius in pixels. Half the height is a pill.                                                         |
| `color`            | `string`                                               | `'currentColor'` | Ink for the text and the tool glyph.                                                                        |
| `surface-color`    | `string`                                               | `'#27272a'`      | The chip surface.                                                                                           |
| `progress-color`   | `string`                                               | `'currentColor'` | The fill that wipes across while running.                                                                   |
| `progress-opacity` | `number`                                               | `0.08`           | How strong that fill is.                                                                                    |
| `done-color`       | `string`                                               | `'#22c55e'`      | The success wash and the check.                                                                             |
| `error-color`      | `string`                                               | `'#ef4444'`      | The stopped fill and the retry glyph on error.                                                              |
| `wash-opacity`     | `number`                                               | `0.14`           | Strength of the success wash and of the error tint.                                                         |
| `shake`            | `number`                                               | `6`              | Error shake amplitude in pixels. `0` tints only.                                                            |
| `show-timer`       | `boolean`                                              | `true`           | Shows the millisecond counter.                                                                              |
| `class`            | `string`                                               | `''`             | Extra classes for the root.                                                                                 |

## Events and slots

| Name          | Payload | Description                                                               |
| ------------- | ------- | ------------------------------------------------------------------------- |
| `retry` event | —       | When bound, the failed chip becomes a retry button that fires this event. |
| `#icon` slot  | —       | Replaces the tool glyph (the check and retry glyphs stay).                |

## Accessibility

- The root has `role="status"` and sets `aria-busy` while running.
- A visually hidden line announces the result, for example "bash npm test, done in 1417 ms".
- With `@retry` bound, the failed chip holds a native button labelled "Retry bash npm test" with a visible focus ring.
- With `prefers-reduced-motion`, the shake, glyph roll and done wipe are removed, and the timer updates every 100 ms instead of every frame.

- Ported from [React Bits](https://reactbits.dev/micro/call-chip) by David Haz.
