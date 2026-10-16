---
title: Swipe Toast
description: Toast that swipes down to dismiss and burns a thin fuse for its remaining time.
---

A toast that rises in, burns a thin fuse along its edge for the time it has left, and closes itself when the fuse runs out. Drag it down (or flick it) to dismiss, hover or focus it to freeze the fuse, and press Escape to close it from the keyboard.

::demo-swipe-toast
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/swipe-toast.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import SwipeToast from '~/components/ui/swipe-toast/SwipeToast.vue';
  import type { SwipeToastCloseReason } from '~/components/ui/swipe-toast/types';

  const open = ref(true);

  function undo() {
    // restore the archived file
  }

  function onClose(reason: SwipeToastCloseReason) {
    console.log('closed by', reason);
    open.value = false;
  }
</script>

<template>
  <SwipeToast
    :open="open"
    icon="lucide:circle-check"
    title="File archived"
    description="Moved to Archive"
    action-label="Undo"
    :duration="4000"
    inline
    @action="undo"
    @close="onClose"
  />
</template>
```

Without `inline`, the toast is fixed to the bottom-right corner of the viewport. With `inline`, it sits in normal flow and its slot collapses smoothly after it leaves, so a column of toasts closes up without jumping.

## Props

| Prop             | Type                          | Default           | Description                                                                                      |
| ---------------- | ----------------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `title`          | `string`                      | `'File archived'` | The first line (or use the `title` slot).                                                        |
| `description`    | `string`                      | `''`              | The dimmer second line. Empty hides it.                                                          |
| `icon`           | `string`                      | `''`              | Iconify name of an 18px icon before the text (or use the `icon` slot).                           |
| `action-label`   | `string`                      | `''`              | The inverted button. Empty hides it.                                                             |
| `open`           | `boolean`                     | `true`            | Flip to `false` to close from outside. `true` again re-enters.                                   |
| `background`     | `string`                      | `'#27272a'`       | The card surface, and the action text.                                                           |
| `color`          | `string`                      | `'#f5f5f5'`       | Ink: title, description at 66% and the action fill.                                              |
| `fuse-color`     | `string`                      | `'#f5a524'`       | The burning line.                                                                                |
| `width`          | `number`                      | `356`             | Card width in pixels, capped at the parent when inline.                                          |
| `radius`         | `number`                      | `12`              | Corner radius in pixels.                                                                         |
| `slide-ms`       | `number`                      | `400`             | How long the rise and the drop take.                                                             |
| `settle-bounce`  | `number`                      | `0.2`             | Overshoot of the return after an abandoned swipe. `0` stops dead.                                |
| `swipe-distance` | `number`                      | `40`              | How far a slow drag must go before release dismisses. A flick always does.                       |
| `duration`       | `number`                      | `4000`            | Milliseconds until it closes itself. Changing it re-arms the fuse. `0` keeps it until dismissed. |
| `fuse`           | `'bottom' \| 'top' \| 'none'` | `'bottom'`        | Which edge the line burns along. `none` keeps the timer but shows nothing.                       |
| `pause-on-hover` | `boolean`                     | `true`            | Hovering freezes the line and the timer.                                                         |
| `close-button`   | `boolean`                     | `false`           | Adds a cross at the end of the row.                                                              |
| `inline`         | `boolean`                     | `false`           | In flow inside the parent instead of fixed to the viewport corner.                               |
| `dismissible`    | `boolean`                     | `true`            | Off removes the swipe and Escape.                                                                |
| `class`          | `string`                      | `''`              | Extra classes for the root.                                                                      |

## Events

| Event    | Payload                                                                     | Description                                                    |
| -------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `action` | —                                                                           | The action button was pressed, before the close.               |
| `close`  | `'timeout' \| 'swipe' \| 'action' \| 'close' \| 'escape' \| 'programmatic'` | Fired after the exit, and after the inline slot has collapsed. |

## Slots

| Slot          | Description                      |
| ------------- | -------------------------------- |
| `icon`        | Replaces the `icon` prop.        |
| `title`       | Replaces the `title` text.       |
| `description` | Replaces the `description` text. |

## Accessibility

- The card is a polite live region (`role="status"`, `aria-live="polite"`), so screen readers announce it without interrupting.
- The card is focusable; focus pauses the fuse just like hover, and Escape closes it.
- When the action or close button is pressed from the keyboard, the toast closes instantly instead of animating.
- With `prefers-reduced-motion`, the rise and drop become a plain fade and the swipe-out skips the throw.

- Ported from [React Bits](https://reactbits.dev/micro/swipe-toast) by David Haz.
