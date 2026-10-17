---
title: Reflective Card
description: A satin metal ID card that reflects a looping video or your camera, tilts toward the cursor and catches a sweeping light.
---

A brushed-metal ID card rendered with WebGL2. It reflects a looping video (or a soft studio when there is none), switches to your mirrored camera when `webcam` is on, tilts toward the cursor or finger and catches a light that follows the pointer. Move over the card to tilt it; use the panel to try presets, the camera and the surface controls.

::demo-reflective-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/reflective-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ReflectiveCard from '~/components/ui/reflective-card/ReflectiveCard.vue';

  const cameraOn = ref(false);

  function onWebcamError(error: Error) {
    console.warn(error.message);
    cameraOn.value = false;
  }
</script>

<template>
  <ReflectiveCard
    name="Alexander Doe"
    role="Senior Developer"
    theme="dark"
    video-src="/videos/reflection.mp4"
    :webcam="cameraOn"
    tint="#f3cf8a"
    :roughness="0.3"
    :blur-strength="6"
    @webcam-error="onWebcamError"
  />
</template>
```

The video must be same-origin or served with CORS headers, because its frames are uploaded to a WebGL texture. Without `video-src` the card reflects a soft studio light.

## Props

| Prop            | Type                | Default              | Description                                                                    |
| --------------- | ------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `name`          | `string`            | `'Alexander Doe'`    | Name shown on the card                                                         |
| `role`          | `string`            | `'Senior Developer'` | Role shown under the name                                                      |
| `badge`         | `string`            | `'Verified'`         | Label of the badge in the top left corner                                      |
| `status`        | `string`            | `'Active'`           | Label of the status chip in the top right corner                               |
| `status-color`  | `string`            | `'#22c55e'`          | Color of the status dot                                                        |
| `id-label`      | `string`            | `'ID number'`        | Small label above the ID number                                                |
| `id-value`      | `string`            | `'8901 2345 6789'`   | ID number shown in the footer                                                  |
| `theme`         | `'dark' \| 'light'` | `'dark'`             | Dark graphite or light silver metal, with matching text                        |
| `video-src`     | `string`            | —                    | Looping video the card reflects when the camera is off                         |
| `webcam`        | `boolean`           | `false`              | Reflects the mirrored camera feed. Asks for access and falls back to the video |
| `tint`          | `string`            | `'#ffffff'`          | Color of the metal. White gives plain steel                                    |
| `metalness`     | `number`            | `1`                  | How strongly the surface mirrors the scene, 0–1. At 0 the card turns matte     |
| `roughness`     | `number`            | `0.3`                | Brushed grain, 0–1. Stretches reflections along the grain                      |
| `blur-strength` | `number`            | `6`                  | Blur of the reflection (px)                                                    |
| `grayscale`     | `number`            | `1`                  | Removes color from the reflection, 0–1                                         |
| `warp`          | `number`            | `0.6`                | Gentle bends in the surface that ripple the reflection                         |
| `warp-scale`    | `number`            | `1`                  | Size of the bends                                                              |
| `shine`         | `number`            | `1`                  | Brightness of the light band that sweeps across the card as it tilts           |
| `bevel`         | `number`            | `3`                  | Width of the polished edge that catches the light (px)                         |
| `glare`         | `number`            | `0.5`                | Strength of the light that follows the cursor, 0–1                             |
| `enable-tilt`   | `boolean`           | `true`               | Tilts the card toward the cursor                                               |
| `tilt-strength` | `number`            | `12`                 | Largest tilt angle (degrees)                                                   |
| `intro`         | `boolean`           | `true`               | Fades the card in and sweeps the light across it once                          |
| `width`         | `number \| string`  | `320`                | Width of the card. Numbers are px                                              |
| `height`        | `number \| string`  | `500`                | Height of the card. Numbers are px                                             |
| `radius`        | `number`            | `24`                 | Corner radius (px)                                                             |
| `class`         | `string`            | `''`                 | Extra classes for the card                                                     |

## Events

| Event          | Payload          | Description                                       |
| -------------- | ---------------- | ------------------------------------------------- |
| `webcam-error` | `(error: Error)` | Fired when camera access is denied or unavailable |

## Slots

| Slot      | Description                                              |
| --------- | -------------------------------------------------------- |
| `default` | Custom card content. Replaces the badge, name and footer |

## Accessibility

- The canvas and the hidden video elements are `aria-hidden`; the card text stays real, selectable-by-screen-reader DOM.
- With `prefers-reduced-motion: reduce` the card does not tilt, skips the intro and does not autoplay the video.
- The camera is only requested when `webcam` is `true`, and the stream is stopped when it turns off or the card unmounts.

- Ported from [React Bits](https://reactbits.dev/components/reflective-card) by David Haz.
