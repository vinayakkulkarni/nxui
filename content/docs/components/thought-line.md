---
title: Thought Line
description: Reasoning trace header with a live clock that folds its steps into one line when done.
---

A one-line “Thinking…” header for AI answers. While working, the glyph breathes, a band of ink shimmers across the label and a clock counts up; steps appear beneath it, the last one pulsing. When `working` turns false the label crossfades to “Thought for 4.1s”, the clock glides into the sentence and the trace folds away. Click the line to reopen the trace.

::demo-thought-line
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/thought-line.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ThoughtLine from '~/components/ui/thought-line/ThoughtLine.vue';

  const working = ref(true);
  const steps = ref(['Reading the question', 'Searching your notes']);

  function onSettle(seconds: number) {
    console.log('thought for', seconds);
  }
</script>

<template>
  <ThoughtLine
    label="Thinking…"
    :steps="steps"
    :working="working"
    :font-size="18"
    @settle="onSettle"
  />
</template>
```

## Props

| Prop                 | Type                           | Default          | Description                                                          |
| -------------------- | ------------------------------ | ---------------- | -------------------------------------------------------------------- |
| `label`              | `string`                       | `'Thinking…'`    | The working line. It breathes, and it is the spoken text             |
| `done-label`         | `string`                       | `''`             | Settled line. Empty gives “Thought for”, or “Done thinking” no timer |
| `glyph`              | `'sparkle' \| 'dot' \| 'none'` | `'sparkle'`      | The mark that breathes and dims (or use the `glyph` slot)            |
| `steps`              | `string[]`                     | `[]`             | Trace beneath the line. The last step is current, earlier ones tick  |
| `collapsible`        | `boolean`                      | `true`           | The line becomes a toggle for the trace, with a chevron              |
| `collapse-on-settle` | `boolean`                      | `true`           | Fold the trace into the line when it settles                         |
| `color`              | `string`                       | `'currentColor'` | Ink of the line and the trace                                        |
| `glyph-color`        | `string`                       | `''`             | The glyph alone. Empty follows the ink                               |
| `font-size`          | `number`                       | `16`             | Type size in px. Everything scales in em                             |
| `breath-period`      | `number`                       | `1.6`            | One breath, up and down, in seconds                                  |
| `breath-depth`       | `number`                       | `0.45`           | How far the glyph and label dim at the trough. `0` is no breath      |
| `shimmer`            | `boolean`                      | `true`           | A band of ink sweeps the working label                               |
| `shimmer-duration`   | `number`                       | `1.8`            | One sweep, in seconds                                                |
| `settle-duration`    | `number`                       | `350`            | The settle chord in ms: crossfade, dim, glide, fold                  |
| `settle-blur`        | `number`                       | `2`              | Blur through the crossfade seam, in px                               |
| `working`            | `boolean`                      | `true`           | Working or settled. `true` again starts a new clock                  |
| `settle-after`       | `number`                       | `0`              | Seconds after which it settles by itself. `0` waits for `working`    |
| `elapsed`            | `number`                       | —                | Controlled seconds. The internal clock never runs                    |
| `show-timer`         | `boolean`                      | `true`           | The live clock that freezes into the sentence                        |
| `class`              | `string`                       | `''`             | Extra classes for the root                                           |

## Events

| Event    | Payload           | Description                       |
| -------- | ----------------- | --------------------------------- |
| `settle` | `seconds: number` | Once per settle, with frozen time |

## Slots

| Slot    | Scope                                | Description                                    |
| ------- | ------------------------------------ | ---------------------------------------------- |
| `glyph` | —                                    | Custom glyph in place of the sparkle or dot    |
| `label` | `{ text: string; working: boolean }` | Wraps either label string. Inline content only |

## Accessibility

- The visual label and timer are `aria-hidden`; a `role="status"` region announces the working label, then “Thought for 4.1 seconds” once.
- When there is a trace and `collapsible` is on, the line is a real `<button>` with `aria-expanded`.
- With `prefers-reduced-motion`, the shimmer is dropped, the breath is shallower and slower, and the crossfade loses its blur.

- Ported from [React Bits](https://reactbits.dev/micro/thought-line) by David Haz.
