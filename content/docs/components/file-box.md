---
title: File Box
description: A cardboard file box of five tabbed folders. Hover a folder to lift it out by its tab; click it to give it a tug.
---

# File Box

A cardboard file box holding five colourful folders, drawn as one SVG in an oblique projection. Hover or focus a folder and it is pulled up by its tab, leaning a little toward that side. Its front flap falls open a beat later, the three sheets inside trail behind on looser springs, and the neighbouring folders give way. Click it, or press Enter or Space, to tug it up past the hover height. The scene tilts a few degrees with the pointer and the shadow answers it. On a theme change every face and folder cross-fades and the box settles under the new light.

::demo-file-box
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/file-box.json"
```

## Usage

```vue
<script setup lang="ts">
  import { computed } from 'vue';
  import FileBox from '~/components/ui/file-box/FileBox.vue';
  import type { FileBoxPull } from '~/components/ui/file-box/types';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onPull(folder: FileBoxPull) {
    console.log(folder.color, folder.position);
  }
</script>

<template>
  <div class="h-100 w-full">
    <FileBox fill :theme="theme" @pull="onPull" />
  </div>
</template>
```

Without `fill` the box is a square that takes the full width of its parent. With `fill` it fills the parent edge to edge, and the scene centres in the largest square that fits.

## Props

| Prop    | Type                | Default   | Description                                               |
| ------- | ------------------- | --------- | --------------------------------------------------------- |
| `theme` | `'light' \| 'dark'` | `'light'` | Colour theme. Pass your site's colour mode.               |
| `fill`  | `boolean`           | `false`   | Fill the parent edge to edge instead of keeping a square. |
| `class` | `string`            | `''`      | Extra classes for the root element.                       |

## Events

| Event  | Payload                 | Description                                                                                      |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `pull` | `(folder: FileBoxPull)` | Fires when a folder is tugged, with its `color` and its `position` counted from the front (1–5). |

## Exposed methods

| Method    | Signature                            | Description                                                       |
| --------- | ------------------------------------ | ----------------------------------------------------------------- |
| `hover`   | `(position: number \| null) => void` | Lift the folder at `position` (1 = front), or drop them all.      |
| `pull`    | `(position: number) => void`         | Tug the folder at `position`.                                     |
| `release` | `() => void`                         | Drop a folder lifted through `hover`. A real hover is left alone. |
| `replay`  | `() => void`                         | Play the intro again.                                             |

## Accessibility

- Each folder is a focusable `role="button"` with a label such as "Pull out the pink folder, middle from the front". Tab moves through the folders from back to front.
- Focus lifts a folder exactly like hover. Enter or Space tugs it. A dashed focus ring outlines the focused folder.
- Press R while a folder has focus to replay the intro.
- The SVG is a labelled `role="group"`. The paper grain is hidden from assistive tech.
- With reduced motion the folders move without springs, the tug and the pointer tilt are off, and the intro is skipped.

Ported from [File Box](https://pinui.xyz/components/file-box) by Pin UI, MIT licence.
