---
title: Voice Pill
description: Mic button that swells into a capsule of live equalizer bars and a timer while recording.
---

A dictation button. Press it and the circle opens to the left into a capsule with a scrolling waveform and an elapsed clock, and the mic turns into a stop mark. A tap latches it on; a long press stops when you let go. While holding, slide left to drag the contents along and reveal Cancel — cross the distance and it stops without a result.

::demo-voice-pill
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/voice-pill.json"
```

## Usage

```vue
<script setup lang="ts">
  import VoicePill from '~/components/ui/voice-pill/VoicePill.vue';
  import type { VoicePillStopDetail } from '~/components/ui/voice-pill/types';

  function onStop(detail: VoicePillStopDetail) {
    if (detail.reason !== 'cancel') console.log('recorded', detail.duration);
  }
</script>

<template>
  <VoicePill :size="40" :reach="12" reactive="mic" @stop="onStop" />
</template>
```

The capsule grows to the left of the button, so give it room on that side (for example, place it at the right end of a prompt input).

## Props

| Prop              | Type                           | Default       | Description                                                                                              |
| ----------------- | ------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------- |
| `accent-color`    | `string`                       | `'#f5f5f5'`   | The waveform, the clock and the stop mark.                                                               |
| `icon-color`      | `string`                       | `'#a1a1aa'`   | The mic at rest, and the hover wash.                                                                     |
| `background`      | `string`                       | `'#27272a'`   | The capsule surface.                                                                                     |
| `size`            | `number`                       | `28`          | Footprint in px. The icon, the stop mark and the clock scale with it.                                    |
| `shape`           | `'pill' \| 'rounded'`          | `'pill'`      | A circle that opens into a capsule, or a rounded square.                                                 |
| `reach`           | `number`                       | `8`           | The room the capsule leaves before the waveform, in px.                                                  |
| `show-time`       | `boolean`                      | `true`        | An elapsed clock in the capsule, which grows to the left to hold it.                                     |
| `waveform`        | `boolean`                      | `true`        | A history of the level scrolling through the capsule, past the clock.                                    |
| `slide-to-cancel` | `boolean`                      | `true`        | While held, sliding left drags the capsule contents along and reveals Cancel.                            |
| `cancel-distance` | `number`                       | `64`          | How far left a held pointer slides before it cancels, in px.                                             |
| `attack`          | `number`                       | `40`          | How fast the level rises to a louder signal, in ms.                                                      |
| `release`         | `number`                       | `240`         | How long the level hangs after the sound drops, in ms.                                                   |
| `sensitivity`     | `number`                       | `1`           | Gain on the signal before the envelope.                                                                  |
| `floor`           | `number`                       | `0.1`         | Waveform bar height when silent, as a fraction of its box.                                               |
| `open-duration`   | `number`                       | `200`         | The capsule open and close, in ms.                                                                       |
| `press-scale`     | `number`                       | `0.95`        | Scale of the button while a pointer is down.                                                             |
| `mode`            | `'auto' \| 'hold' \| 'toggle'` | `'auto'`      | Auto: a tap latches, a hold stops on release. Hold: release always stops. Toggle: release never stops.   |
| `hold-after`      | `number`                       | `300`         | In auto, the press length after which a release stops instead of latching, in ms.                        |
| `reactive`        | `'simulated' \| 'mic'`         | `'simulated'` | What drives the level. Mic asks for microphone permission on the first press and stops if it is refused. |
| `disabled`        | `boolean`                      | `false`       | Dimmed and inert. A listening pill stops.                                                                |
| `aria-label`      | `string`                       | `'Dictate'`   | Accessible name. The state is carried by `aria-pressed`.                                                 |
| `class`           | `string`                       | `''`          | Extra classes for the button.                                                                            |

## Events

| Event   | Payload                                             | Description                                                                                                          |
| ------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `start` | `{ source: 'simulated' \| 'mic' }`                  | Listening began, with the requested source.                                                                          |
| `stop`  | `{ reason: VoicePillStopReason, duration: number }` | Listening ended. Reason is release, tap, key, escape, blur, cancel, disabled, mic-denied or unmount; duration in ms. |

## Accessibility

- A native `<button>` with `aria-pressed` reflecting the listening state; the name comes from `aria-label`.
- Space or Enter toggles listening; Escape stops it. Keyboard toggles skip the open/close transition.
- The waveform, clock and Cancel hint are decorative (`aria-hidden`).
- The hit area extends to at least 44px for small sizes.
- With reduced motion, the press scale, blur and slide transitions are removed; only opacity fades remain.

- Ported from [React Bits](https://reactbits.dev/micro/voice-pill) by David Haz.
