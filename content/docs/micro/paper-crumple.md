---
title: Paper Crumple
description: An image that crumples into a textured 3D paper ball while you hold it, follows the pointer as you drag, and unfolds when you let go.
---

# Paper Crumple

An image printed on a sheet of paper. Press and hold the sheet to crumple it into a ball, drag to move it, and release to let it unfold, stay crumpled, or unfold with crease marks left behind. The folds come from a small cloth solver that runs once per seed, and the sheet renders with three.js lighting, paper grain and soft shadows. With the keyboard, hold Space or Enter, use the arrow keys to move, and press Escape to reset.

::demo-paper-crumple
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/paper-crumple.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import PaperCrumple from '~/components/ui/paper-crumple/PaperCrumple.vue';
  import type { PaperCrumpleState } from '~/components/ui/paper-crumple/types';

  const state = ref<PaperCrumpleState>('flat');
  const resetKey = ref(0);

  function onState(next: PaperCrumpleState) {
    state.value = next;
  }
</script>

<template>
  <PaperCrumple
    src="/images/poem.jpg"
    alt="A handwritten poem on paper"
    :width="400"
    :height="400"
    :scene-height="360"
    image-fit="contain"
    release-behavior="creased"
    :reset-key="resetKey"
    @state-change="onState"
  />
</template>
```

Remote images must send CORS headers, because the image becomes a WebGL texture. The original image shows as a fallback while the scene loads or if WebGL is unavailable.

## Props

| Prop               | Type                               | Default              | Description                                                               |
| ------------------ | ---------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| `src`              | `string`                           | required             | Image URL. PNG transparency is kept. Remote hosts must allow CORS.        |
| `alt`              | `string`                           | `'Crumplable image'` | Text for the fallback image and the hold control.                         |
| `back-src`         | `string`                           | `''`                 | Image printed on the back. Otherwise the back uses `paper-color`.         |
| `width`            | `number`                           | `320`                | Unfolded paper width in px. Scales down to fit the stage (24px inset).    |
| `height`           | `number`                           | `400`                | Unfolded paper height in px. Sets the aspect ratio.                       |
| `scene-height`     | `number`                           | `560`                | Stage height in px, including room to drag.                               |
| `image-fit`        | `'cover' \| 'contain'`             | `'cover'`            | `cover` crops the texture; `contain` keeps the whole image.               |
| `release-behavior` | `'stay' \| 'restore' \| 'creased'` | `'restore'`          | Freeze the crumple, unfold fully, or unfold with lasting creases.         |
| `crumple-amount`   | `number`                           | `0.85`               | Maximum fold while held, 0 (flat) to 1 (fully crumpled).                  |
| `crumple-duration` | `number`                           | `0.55`               | Approximate settle time in seconds while holding. 0 is instant.           |
| `release-duration` | `number`                           | `0.4`                | Approximate unfold time in seconds. A new press interrupts it.            |
| `fold-count`       | `number`                           | `6`                  | Crease guides in the solver, 3 to 16.                                     |
| `fold-sharpness`   | `number`                           | `0.6`                | Rounded wrinkles (0) to angular creases (1).                              |
| `wrinkle-depth`    | `number`                           | `0.65`               | Compression depth, 0 to 2. Higher gives a tighter ball.                   |
| `crease-strength`  | `number`                           | `0.18`               | Residual relief for `creased` mode. Longer holds leave stronger creases.  |
| `paper-color`      | `string`                           | `'#f4f0e8'`          | Color of the unprinted back.                                              |
| `roughness`        | `number`                           | `0.92`               | Material roughness, 0 (smooth) to 1 (matte).                              |
| `paper-texture`    | `number`                           | `0.08`               | Paper-grain bump strength, 0 to 1.                                        |
| `light-intensity`  | `number`                           | `1.8`                | Strength of the directional light.                                        |
| `light-angle`      | `number`                           | `-35`                | Key light direction in degrees. 0 shines from above.                      |
| `shadow`           | `boolean`                          | `true`               | Self-shadowing and a soft drop shadow.                                    |
| `shadow-opacity`   | `number`                           | `0.08`               | Opacity of the cast and drop shadows, 0 to 1.                             |
| `draggable`        | `boolean`                          | `true`               | Move the sheet while held. The grabbed point follows the pointer.         |
| `drag-rotation`    | `number`                           | `10`                 | Maximum tilt in degrees while dragging. 0 turns tilt off.                 |
| `drag-radius`      | `number`                           | `180`                | Maximum resting offset per axis in px. The stage also limits it.          |
| `return-to-origin` | `boolean`                          | `true`               | `restore` and `creased` return to the center. `stay` stays where dropped. |
| `rotation`         | `number`                           | `0`                  | Initial sheet rotation in degrees.                                        |
| `seed`             | `number`                           | `7`                  | Seed for a repeatable fold and grain layout.                              |
| `detail`           | `number`                           | `64`                 | Mesh detail, 32 to 96. Higher adds smaller folds and takes longer.        |
| `disabled`         | `boolean`                          | `false`              | Turn off input and finish any active hold.                                |
| `reset-key`        | `number \| string`                 | `0`                  | Change it to reset position, crumple and creases at once.                 |
| `class`            | `string`                           | `''`                 | Extra classes for the stage.                                              |

## Events

| Event          | Payload                                          | Description                                                    |
| -------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `state-change` | `'flat' \| 'holding' \| 'crumpled' \| 'creased'` | Fires on press (`holding`), then with the release state.       |
| `error`        | `Error`                                          | WebGL setup or image loading failed. The fallback image stays. |

## Accessibility

- The sheet is a real `<button>` with an `aria-label` that describes the controls, and `aria-pressed` while held.
- Keyboard: hold Space or Enter to crumple, arrow keys (Shift for bigger steps) to move, Escape to reset. A focus ring shows on keyboard focus.
- A polite `role="status"` region announces loading and errors.
- With `prefers-reduced-motion`, changes are instant and drag tilt is off.
- Rendering pauses when the stage is offscreen or the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/micro/paper-crumple) by David Haz.
