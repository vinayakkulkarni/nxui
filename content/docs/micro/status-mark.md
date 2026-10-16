---
title: Status Mark
description: Agent task status glyph that morphs from an idle ring to a progress arc, then a check.
---

# Status Mark

A small status glyph for an agent's task list. A pending task shows a dashed ring. When it runs, the dashes join into a spinning arc, or into a progress arc when you pass `progress`. On done the ring closes, turns green, draws a check and strikes the label through; on failure it turns red and draws a cross; a cancelled task fades back to a dashed ring with a cross. The demo plays a full lifecycle on a loop; change any status control in the panel to take over by hand.

::demo-status-mark
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/status-mark.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import StatusMark from '~/components/ui/status-mark/StatusMark.vue';
  import type { StatusMarkStatus } from '~/components/ui/status-mark/types';

  const status = ref<StatusMarkStatus>('running');
  const progress = ref<number | undefined>(0.4);
</script>

<template>
  <StatusMark
    :status="status"
    :progress="progress"
    label="Draft supplier emails"
    :size="28"
    :font-size="16"
  />
</template>
```

Leave `progress` undefined while running to get the spinning arc. Leave out `label` (and the slot) to render the glyph alone.

## Props

| Prop            | Type                                                          | Default          | Description                                                              |
| --------------- | ------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| `status`        | `'pending' \| 'running' \| 'done' \| 'failed' \| 'cancelled'` | `'pending'`      | Which state the mark shows.                                              |
| `progress`      | `number`                                                      | —                | 0 to 1. While running, fills the ring to this share instead of spinning. |
| `label`         | `string`                                                      | —                | Task text beside the mark.                                               |
| `color`         | `string`                                                      | `'currentColor'` | Ink for the ring and the label.                                          |
| `done-color`    | `string`                                                      | `'#22c55e'`      | The check and its ring.                                                  |
| `error-color`   | `string`                                                      | `'#ef4444'`      | The cross and its ring on failure.                                       |
| `size`          | `number`                                                      | `20`             | Glyph size in px.                                                        |
| `stroke-width`  | `number`                                                      | `2`              | Stroke width in the 24-unit viewBox.                                     |
| `dashes`        | `number`                                                      | `8`              | Dashes in the pending ring.                                              |
| `font-size`     | `number`                                                      | `14`             | Label size in px.                                                        |
| `spin-duration` | `number`                                                      | `1100`           | Milliseconds per spin while running without progress.                    |
| `arc-length`    | `number`                                                      | `0.68`           | Share of the ring the spinning arc covers.                               |
| `draw-duration` | `number`                                                      | `240`            | Milliseconds to draw the check or cross.                                 |
| `fill-opacity`  | `number`                                                      | `0.06`           | Tint inside the ring when done or failed.                                |
| `strike`        | `boolean`                                                     | `true`           | Strikes the label through when done.                                     |
| `strike-delay`  | `number`                                                      | `60`             | Extra delay before the strike, in ms.                                    |
| `class`         | `string`                                                      | `''`             | Extra classes for the root.                                              |

## Slots

| Slot      | Description                                     |
| --------- | ----------------------------------------------- |
| `default` | Rich label content. Overrides the `label` prop. |

## Accessibility

- With a label, a visually hidden prefix reads the state first, for example "In progress, 62%: Draft supplier emails". The glyph is hidden from assistive tech.
- Without a label, the SVG has `role="img"` and an `aria-label` with the state.
- With `prefers-reduced-motion`, the spinner becomes a slow breathing ring, and the check, cross and strike fade in instead of drawing.

- Ported from [React Bits](https://reactbits.dev/micro/status-mark) by David Haz.
