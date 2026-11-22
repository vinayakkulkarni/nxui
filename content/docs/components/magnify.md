---
title: Magnify
description: A paper poster with one huge letter and a magnifying glass. Through the lens the letter turns out to be rows of tiny characters.
---

# Magnify

A paper poster with one huge letter printed on it, and a magnifying glass over it. Up close the letter is not solid ink: it is rows of tiny characters, and the lens shows them. The glass carries its own copy of the poster at the zoom you set, kept exactly under the lens as it moves, so the magnification is real rather than a blurred scale. Move the pointer to inspect and click to push the zoom further. On arrival the outline traces itself, the ink floods in and the glass drops into place. The lens tilts with its speed, floats a little at rest and lifts its shadow while held.

::demo-magnify
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magnify.json"
```

## Usage

```vue
<script setup lang="ts">
  import { computed } from 'vue';
  import Magnify from '~/components/ui/magnify/Magnify.vue';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onZoomChange(zoomed: boolean) {
    console.log(zoomed);
  }
</script>

<template>
  <Magnify
    glyph="A"
    micro="a"
    :zoom="2.6"
    :zoom-max="4.2"
    :lens-radius="50"
    :theme="theme"
    @zoom-change="onZoomChange"
  />
</template>
```

The poster is drawn in a fixed 500 × 680 space and scaled to its width, so `lens-radius` and the lens position are in poster units. The letter uses your site font at weight 700.

## Props

| Prop          | Type                | Default   | Description                                                  |
| ------------- | ------------------- | --------- | ------------------------------------------------------------ |
| `theme`       | `'light' \| 'dark'` | `'light'` | Cream paper with black ink, or graphite with cream.          |
| `glyph`       | `string`            | `'A'`     | The big letter on the poster (up to two characters).         |
| `micro`       | `string`            | `'a'`     | The tiny characters the letter is printed from.              |
| `zoom`        | `number`            | `2.6`     | Magnification at rest.                                       |
| `zoom-max`    | `number`            | `4.2`     | Magnification after a click or Enter.                        |
| `lens-radius` | `number`            | `50`      | The glass radius in poster units (the poster is 500 wide).   |
| `size`        | `number`            | `380`     | The poster width in px. It never grows past its container.   |
| `intro`       | `boolean`           | `true`    | The outline trace and the lens dropping in on arrival.       |
| `hint`        | `boolean`           | `true`    | The "Move to inspect · Click to zoom" line under the poster. |
| `class`       | `string`            | `''`      | Extra classes for the root element.                          |

## Events

| Event         | Payload             | Description                  |
| ------------- | ------------------- | ---------------------------- |
| `zoom-change` | `(zoomed: boolean)` | Fires when the zoom toggles. |

## Exposed

| Method       | Signature                | Description                                  |
| ------------ | ------------------------ | -------------------------------------------- |
| `moveTo`     | `(x: number, y: number)` | Move the lens to a point in poster units.    |
| `setZoomed`  | `(zoomed: boolean)`      | Set the zoom state.                          |
| `toggleZoom` | `()`                     | Toggle between `zoom` and `zoom-max`.        |
| `rest`       | `()`                     | Put the lens back at rest and drop the zoom. |

## Accessibility

- The poster is one focusable `role="img"` with a label that names the letter, the micro characters and the controls.
- Arrow keys move the lens 10 poster units (Shift for 30). Enter or Space toggles the zoom. Escape puts the lens back at rest.
- A visible focus ring shows on keyboard focus.
- With reduced motion the intro is skipped, the lens does not tilt or float, and the theme switches without a cross-fade.

Ported from [Magnify](https://pinui.xyz/components/magnify) by Pin UI, MIT licence.
