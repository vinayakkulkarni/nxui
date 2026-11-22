---
title: Distortion Wave
description: A WebGL 2 wave that leaves a button or icon, bends the view with refraction and colour split, and leaves the next view behind.
---

# Distortion Wave

A transition between two views of the same card. When `revealed` turns true, the view first draws in toward the button you pressed, then a wave leaves it and crosses the card, leaning toward the press point. The front bends what it passes, splits the colour channels at its edge, glows in a band of colour with sparks behind it, and leaves the revealed view sharpening in its wake. The rim keeps a soft glow for a moment after. Set `revealed` back to false and the wave folds back into its source. Controls in the `#overlay` slot stay live and crisp above the wave. In the demo, press Confirm, Buy 500 credits or the retry button on the toast.

::demo-distortion-wave
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/distortion-wave.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import DistortionWave from '~/components/ui/distortion-wave/DistortionWave.vue';

  const paid = ref(false);
  const button = ref<HTMLButtonElement | null>(null);
</script>

<template>
  <DistortionWave
    v-model:revealed="paid"
    :source="button"
    class="w-80 overflow-hidden rounded-4xl border border-border bg-card"
  >
    <div class="p-6 pb-22">Review the payment…</div>
    <template #revealed>
      <div class="p-6 pb-22">Payment sent.</div>
    </template>
    <template #overlay>
      <button
        ref="button"
        class="absolute inset-x-5 bottom-5 h-11 rounded-full bg-foreground text-background"
        @click="paid = !paid"
      >
        {{ paid ? 'Done' : 'Confirm' }}
      </button>
    </template>
  </DistortionWave>
</template>
```

Give the element a solid background (or put one behind it), rounded corners and `overflow-hidden`; the glow follows its corner radius. Both views share one grid cell and the element takes the size of the larger one.

To drive it by hand, take a template ref and call `play()`, `reverse()` or `reset()`.

## Props

| Prop              | Type                                                      | Default              | Description                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `revealed`        | `boolean`                                                 | —                    | Which view shows. Changing it runs the wave. Use with `v-model:revealed`.                                                                                                           |
| `source`          | `Element \| component \| { x, y, width, height } \| null` | last pressed control | Where the wave leaves from: an element or template ref, or a box in the element's own CSS pixels. Without one, the control last pressed inside the element, else the bottom centre. |
| `colors`          | `'prism' \| 'meadow' \| 'lagoon' \| 'ember' \| string[]`  | `'prism'`            | A preset or up to four `#rrggbb` colours for the glowing band and the rim.                                                                                                          |
| `duration`        | `number`                                                  | `1.6`                | Seconds the wave takes to cross, glow included.                                                                                                                                     |
| `return-duration` | `number`                                                  | `0.9`                | Seconds the wave takes to fold back.                                                                                                                                                |
| `refraction`      | `number`                                                  | `1`                  | How strongly the front bends what it passes (0–2).                                                                                                                                  |
| `aberration`      | `number`                                                  | `1`                  | How far the colour channels split at the front (0–2).                                                                                                                               |
| `lean`            | `number`                                                  | `0.2`                | How far the front leans toward the press point (0–1).                                                                                                                               |
| `sparks`          | `boolean`                                                 | `true`               | Fine sparks just behind the front.                                                                                                                                                  |
| `radius`          | `number`                                                  | the element's own    | Corner radius of the glow in CSS pixels.                                                                                                                                            |
| `motion`          | `'auto' \| 'full' \| 'reduce'`                            | `'auto'`             | `auto` crossfades when the visitor asks for reduced motion; `reduce` always crossfades; `full` always runs the wave.                                                                |
| `class`           | `string`                                                  | `''`                 | Classes for the root element.                                                                                                                                                       |

## Events

| Event             | Payload             | Description                                                                |
| ----------------- | ------------------- | -------------------------------------------------------------------------- |
| `update:revealed` | `boolean`           | The view now showing, when a wave started by `play()` or `reverse()` ends. |
| `start`           | `revealed: boolean` | A wave starts toward this view.                                            |
| `finish`          | `revealed: boolean` | A wave ends on this view.                                                  |

## Slots

| Slot       | Description                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| default    | The first view.                                                                                      |
| `revealed` | The view the wave leaves behind. Without it the wave crosses the first view and leaves it as it was. |
| `overlay`  | Live controls above the wave. They are not bent or tinted, and they take clicks over both views.     |

## Methods

| Method                      | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `play({ source?, point? })` | Runs the wave to the revealed view, from a source and press point if given. |
| `reverse()`                 | Folds the wave back to the first view.                                      |
| `reset()`                   | Jumps to the first view with no wave.                                       |
| `prepare()`                 | Takes the pictures of both views now, so the next wave starts at once.      |

## How it works

The wave runs on a WebGL 2 canvas laid over the element only while it moves. Before a run, each view is drawn into a picture (computed styles inlined into an SVG, with the page's same-origin fonts embedded). The shader then bends, blurs and splits those pictures around the front. Images from another origin without CORS, closed shadow roots and pseudo-elements do not appear in the picture; they come back the moment the wave ends. Add `data-wave-skip` to leave an element out of the picture.

## Accessibility

- The hidden view is `inert` and `aria-hidden`, so focus and screen readers only reach the view that shows. The swap happens when the wave ends.
- Controls in `#overlay` keep focus and keyboard access through the whole run; announce state changes there (for example with `role="status"`).
- Under `prefers-reduced-motion: reduce`, or without WebGL 2, the views crossfade in 300 ms instead.
- The canvas is `aria-hidden` and takes no pointer events.
