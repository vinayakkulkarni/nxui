---
title: Recorder
description: A voice recorder card with a scrolling waveform under a fixed playhead, a rolling HH:MM:SS timer and a hold-to-clear key.
---

# Recorder

A voice recorder card with no microphone. The input is a generated voice-like signal, and playback is a silent, timed replay of the same take. The red key records, pauses and resumes; the side key stops and saves the take. On a saved take the red key plays, and the side key becomes hold-to-clear: a red ring fills round it and the waveform collapses. Drag the waveform, scroll over the card or use the arrow keys to scrub. Space and S work while the card has focus.

::demo-recorder
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/recorder.json"
```

## Usage

```vue
<script setup lang="ts">
  import { computed } from 'vue';
  import Recorder from '~/components/ui/recorder/Recorder.vue';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onSave(seconds: number) {
    console.log(`saved ${seconds.toFixed(1)}s`);
  }
</script>

<template>
  <Recorder :size="360" :theme="theme" @save="onSave" />
</template>
```

The card is drawn on a 700 × 700 grid and scaled as one piece. It never grows past `size`, and it shrinks further to fit the box it sits in and the window.

## Props

| Prop         | Type                | Default  | Description                                                                        |
| ------------ | ------------------- | -------- | ---------------------------------------------------------------------------------- |
| `size`       | `number`            | `360`    | Width of the card in px. It shrinks further to fit its container and the viewport. |
| `sound`      | `boolean`           | `true`   | Tactile clicks on every press and a tick as you scrub, synthesised with Web Audio. |
| `auto-focus` | `boolean`           | `false`  | Focus the card on mount, so Space and S work straight away.                        |
| `theme`      | `'light' \| 'dark'` | `'dark'` | `dark` graphite or `light` porcelain. The red key is the same in both.             |
| `class`      | `string`            | `''`     | Extra classes for the root element.                                                |

## Events

| Event  | Payload             | Description                                       |
| ------ | ------------------- | ------------------------------------------------- |
| `save` | `(seconds: number)` | Fires when a take is saved, with its length in s. |

## Keyboard

| Key       | Action                                                  |
| --------- | ------------------------------------------------------- |
| `Space`   | Record, pause, resume; on a saved take, play and pause. |
| `S`       | Stop and save. On a saved take, hold to clear it.       |
| `←` / `→` | Scrub a saved take by one second.                       |

## Accessibility

- Both keys are real buttons. Their `aria-label` follows the state: Record, Pause, Resume recording, Play, Pause playback; Stop, or Hold to clear the recording.
- The status label (READY, REC, PAUSED, SAVED, PLAY) sits in an `aria-live="polite"` region. The timer has `role="timer"` and an `aria-label` with the elapsed time.
- The keyboard listens on the card, not the page, so Space still scrolls the page when the card does not have focus.
- Both keys show a focus ring on keyboard focus. The side key is disabled before the first take.
- With reduced motion the digits, label and glyphs change without rolling or springing, and the clear skips the collapse.

Ported from [Recorder](https://pinui.xyz/components/recorder) by Pin UI, MIT licence.
