---
title: Refine Frame
description: Media frame that steps an image through generation stages without any layout shift.
---

A frame for AI-generated media that reserves its box up front and walks the image through generation stages. Queued is a dim, blurred pulse; generating and refining resolve a coarse mosaic into a sharp image with a soft scan line; complete shows the real media and fades the status chip. An error dims the frame and, when you listen for `retry`, shows a retry pill.

::demo-refine-frame
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/refine-frame.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import RefineFrame from '~/components/ui/refine-frame/RefineFrame.vue';
  import type { RefineFrameStatus } from '~/components/ui/refine-frame/types';

  const status = ref<RefineFrameStatus>('generating');

  function retry() {
    status.value = 'queued';
  }
</script>

<template>
  <RefineFrame
    :status="status"
    aspect-ratio="4 / 3"
    :width="320"
    :stage-duration="400"
    @retry="retry"
  >
    <img src="/generated.jpg" alt="" draggable="false" />
  </RefineFrame>
</template>
```

Put the media in the default slot. An `<img>` gets the pixel-mosaic reveal, drawn on a canvas from the loaded image; any other media (video, canvas) still gets the blur, saturation and scale stages. Images from another origin only need to be displayable, the canvas is never read back.

## Props

| Prop             | Type                                                              | Default         | Description                                                       |
| ---------------- | ----------------------------------------------------------------- | --------------- | ----------------------------------------------------------------- |
| `status`         | `'queued' \| 'generating' \| 'refining' \| 'complete' \| 'error'` | `'generating'`  | The stage. Each change tweens the media to that stage.            |
| `aspect-ratio`   | `string`                                                          | `'4 / 3'`       | The box reserved before and during generation, so nothing shifts. |
| `width`          | `number`                                                          | `320`           | Frame width in px, capped at the parent.                          |
| `radius`         | `number`                                                          | `16`            | Corner radius in px.                                              |
| `background`     | `string`                                                          | `'#27272a'`     | The paper behind the media, and the chip surface.                 |
| `color`          | `string`                                                          | `'#f5f5f5'`     | The ink: chip text, the sweep and the retry pill.                 |
| `stage-duration` | `number`                                                          | `400`           | Each stage tween, in ms.                                          |
| `sweep`          | `boolean`                                                         | `true`          | A soft band crosses the frame while it works.                     |
| `show-status`    | `boolean`                                                         | `true`          | The chip with the mark and the stage label.                       |
| `hide-after`     | `number`                                                          | `1200`          | Ms after completion before the chip fades. `0` keeps it.          |
| `labels`         | `Partial<Record<RefineFrameStatus, string>>`                      | built-in labels | Chip text per stage: Queued, Generating, Refining, Ready, Failed. |
| `retry-label`    | `string`                                                          | `'Retry'`       | The pill on an error.                                             |
| `class`          | `string`                                                          | `''`            | Extra classes for the frame.                                      |

## Events

| Event   | Payload | Description                                                       |
| ------- | ------- | ----------------------------------------------------------------- |
| `retry` | —       | The retry pill was pressed. Without a `@retry` listener, no pill. |

## Slots

| Slot      | Description                                                   |
| --------- | ------------------------------------------------------------- |
| `default` | The media: an `img`, `video` or `canvas`. It fills the frame. |

## Accessibility

- The frame is an image labelled with the current stage, and it sets `aria-busy` while it works.
- A visually hidden `role="status"` region announces each stage change.
- The retry pill is a real button with a visible focus ring.
- With `prefers-reduced-motion`, the mosaic jumps straight to each stage, and the sweep, pulse and spinner stop.

- Ported from [React Bits](https://reactbits.dev/micro/refine-frame) by David Haz.
