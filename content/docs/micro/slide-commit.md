---
title: Slide Commit
description: Slide-to-confirm handle that spins while your action runs, then unfurls into a done pill or shakes back on failure.
---

Drag the handle to the end of the track to confirm. The handle stretches as it travels and squashes if you push it back past the start. Return a promise from `on-confirm` and the handle shows a spinner until it settles. Success unfurls a done pill; a failure shakes the track, turns the handle red and springs it home.

::demo-slide-commit
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/slide-commit.json"
```

## Usage

```vue
<script setup lang="ts">
  import SlideCommit from '~/components/ui/slide-commit/SlideCommit.vue';

  function pay() {
    return fetch('/api/pay', { method: 'POST' });
  }
</script>

<template>
  <SlideCommit
    label="Slide to pay"
    done-label="Paid"
    error-label="Payment failed"
    :on-confirm="pay"
    @done="console.log('paid')"
  />
</template>
```

## Props

| Prop            | Type            | Default            | Description                                                                                                    |
| --------------- | --------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `label`         | `string`        | `'Slide to pay'`   | Track text, and the accessible name.                                                                           |
| `done-label`    | `string`        | `'Paid'`           | Pill text after success.                                                                                       |
| `error-label`   | `string`        | `'Payment failed'` | Track text after a failure.                                                                                    |
| `on-confirm`    | `() => unknown` | —                  | Runs when the handle reaches the end. Return a promise to spin until it settles. A rejection or a throw fails. |
| `track-color`   | `string`        | `'#262626'`        | Track fill.                                                                                                    |
| `handle-color`  | `string`        | `'#f5f5f5'`        | Handle fill. Text on it picks black or white for contrast.                                                     |
| `success-color` | `string`        | `'#22c55e'`        | Pill fill on success.                                                                                          |
| `danger-color`  | `string`        | `'#e5484d'`        | Handle fill and error text on failure.                                                                         |
| `width`         | `number`        | `280`              | Width in pixels.                                                                                               |
| `height`        | `number`        | `56`               | Height in pixels.                                                                                              |
| `radius`        | `number`        | `28`               | Corner radius in pixels, capped at half the height.                                                            |
| `speed`         | `number`        | `50`               | How quickly the handle travels on its springs, 0 to 100.                                                       |
| `return-bounce` | `number`        | `0.38`             | Bounce when the handle springs back home.                                                                      |
| `landing-dip`   | `number`        | `0.026`            | How far the track dips when the pill lands. `0` turns it off.                                                  |
| `hold-ms`       | `number`        | `1500`             | How long the done pill stays before it resets, in ms. `0` keeps it.                                            |
| `disabled`      | `boolean`       | `false`            | Dims the slider and ignores input.                                                                             |
| `class`         | `string`        | `''`               | Extra classes for the root element.                                                                            |

## Events and slots

| Name          | Payload           | Description                                |
| ------------- | ----------------- | ------------------------------------------ |
| `done` event  | —                 | Fires when the action succeeds.            |
| `error` event | `reason: unknown` | Fires when `on-confirm` throws or rejects. |
| `#icon` slot  | —                 | Replaces the arrow on the handle.          |

## Accessibility

- The handle is a focusable `role="slider"` that reports progress as 0 to 100 percent.
- Arrow Right or Up moves it a tenth of the way, and reaching the end confirms. End confirms at once. Arrow Left or Down moves back. Home or Escape returns it.
- While the action runs the handle sets `aria-busy`, and a polite live region announces Working, the done label, or the error label.
- With reduced motion, springs become short eases, the shake is skipped and the spinner breathes instead of turning.

- Ported from [React Bits](https://reactbits.dev/micro/slide-commit) by David Haz.
