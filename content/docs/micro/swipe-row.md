---
title: Swipe Row
description: List row that swipes open to reveal actions and deletes on a full swipe.
---

A list row you drag sideways to reveal a drawer of actions. Release past the halfway point and the drawer snaps open; keep dragging past the commit point and the delete block leaps across the row, so letting go deletes it and the row folds shut. Flicks carry momentum, and the row rubber-bands at both ends.

::demo-swipe-row
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/swipe-row.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import SwipeRow from '~/components/ui/swipe-row/SwipeRow.vue';
  import type { SwipeAction } from '~/components/ui/swipe-row/types';

  const actions: SwipeAction[] = [
    { id: 'delete', label: 'Delete', icon: 'lucide:trash-2' },
    { id: 'archive', label: 'Archive', icon: 'lucide:archive', dismiss: true },
  ];
  const visible = ref(true);
  const open = ref(false);
</script>

<template>
  <SwipeRow
    v-if="visible"
    v-model:open="open"
    label="Design review notes"
    :actions="actions"
    @commit="visible = false"
  >
    <Icon name="lucide:notebook-pen" class="size-5 opacity-60" />
    <span class="flex-1 text-sm font-medium">Design review notes</span>
    <span class="text-xs opacity-50">9:41</span>
  </SwipeRow>
</template>
```

The default slot is the row content you drag. Remove the row in `@commit` — it fires once the row has folded shut.

## Props

| Prop              | Type                | Default                               | Description                                                                                                                                                                          |
| ----------------- | ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `actions`         | `SwipeAction[]`     | `[{ id: 'delete', label: 'Delete' }]` | The drawer, outermost first. Each has `id`, `label`, optional `icon` (Iconify name), `color`, `dismiss` and `onSelect`. The first is the full-swipe action and always folds the row. |
| `action-color`    | `string`            | `'#e5484d'`                           | The full-swipe block that leaps and fills the row.                                                                                                                                   |
| `drawer-color`    | `string`            | `'#3f3f46'`                           | The drawer base and the secondary actions.                                                                                                                                           |
| `row-color`       | `string`            | `'#27272a'`                           | The surface.                                                                                                                                                                         |
| `text-color`      | `string`            | `'#f5f5f5'`                           | Row text and the keyboard toggle.                                                                                                                                                    |
| `height`          | `number`            | `64`                                  | Row height in pixels. The fold closes from it.                                                                                                                                       |
| `radius`          | `number`            | `16`                                  | Corner radius of the row and the clipped drawer.                                                                                                                                     |
| `action-width`    | `number`            | `80`                                  | Width of each action in pixels, so the drawer width too.                                                                                                                             |
| `direction`       | `'left' \| 'right'` | `'left'`                              | Which way you swipe. Everything mirrors.                                                                                                                                             |
| `snap-bounce`     | `number`            | `0.2`                                 | Overshoot of the open or close settle after a flick. Slow releases never bounce.                                                                                                     |
| `resistance`      | `number`            | `0.55`                                | How much of the finger the row keeps past the drawer, and the rubber-band beyond the commit point.                                                                                   |
| `collapse-ms`     | `number`            | `200`                                 | How long a deleted row takes to fold shut.                                                                                                                                           |
| `commit-at`       | `number`            | `0.6`                                 | Fraction of the row width the surface must uncover for the block to leap and a release to delete.                                                                                    |
| `full-swipe`      | `boolean`           | `true`                                | Off, the drawer is the end: no leap, no delete.                                                                                                                                      |
| `disabled`        | `boolean`           | `false`                               | Dims the row and ignores input.                                                                                                                                                      |
| `open`            | `boolean`           | `undefined`                           | Controlled open state (`v-model:open`). Outside changes settle the row.                                                                                                              |
| `close-on-action` | `boolean`           | `true`                                | Closes the drawer after an action is pressed.                                                                                                                                        |
| `haptic`          | `boolean`           | `true`                                | A short vibration on touch when the block leaps.                                                                                                                                     |
| `label`           | `string`            | `'List item'`                         | Accessible name of the row.                                                                                                                                                          |
| `class`           | `string`            | `''`                                  | Extra classes for the root.                                                                                                                                                          |

## Events

| Event         | Payload       | Description                                                                          |
| ------------- | ------------- | ------------------------------------------------------------------------------------ |
| `update:open` | `boolean`     | A gesture or key opened or closed the drawer.                                        |
| `action`      | `SwipeAction` | Any action button was pressed.                                                       |
| `commit`      | `SwipeAction` | A full swipe or a folding action finished and the row has shut. Remove the row here. |

## Slots

| Slot      | Description               |
| --------- | ------------------------- |
| `default` | The row content you drag. |

## Accessibility

- The row is a `group` named by `label`. A visually hidden toggle button shows on keyboard focus and controls the drawer (`aria-expanded`, `aria-controls`).
- On the toggle: Enter, Space or the swipe-direction arrow opens the drawer; the opposite arrow or Escape closes it; Delete or Backspace runs the full-swipe action while open.
- The closed drawer is `inert`, so its buttons are skipped by Tab until it opens.
- A polite live region announces "Release to Delete", the revealed action count and the action that ran.
- With reduced motion, settles become short eased tweens with no spring overshoot.

- Ported from [React Bits](https://reactbits.dev/micro/swipe-row) by David Haz.
