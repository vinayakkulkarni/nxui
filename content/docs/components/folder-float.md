---
title: Folder Float
description: Folder whose notes spring out into a floating cloud when it opens on hover or press.
---

A folder that holds a handful of notes. Hover it (or press it, with `trigger="click"`) and the flap tilts, a sheet of paper rises, and the notes spring out one by one into a cloud above it. Once they land, a zero-gravity Matter.js world takes over: the notes drift and bump into each other, and you can drag and throw them. Click a note to pick it.

::demo-folder-float
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/folder-float.json"
```

## Usage

```vue
<script setup lang="ts">
  import FolderFloat from '~/components/ui/folder-float/FolderFloat.vue';
  import type { FolderFloatItem } from '~/components/ui/folder-float/types';

  const notes: FolderFloatItem[] = [
    'Try a warmer palette',
    'Tighten the spacing',
    { label: 'Logo feels small', value: 'logo' },
    'Love the new hero',
  ];

  function onSelect(value: string, index: number) {
    console.log(value, index);
  }
</script>

<template>
  <FolderFloat :items="notes" label="Design feedback" @select="onSelect" />
</template>
```

The cloud rises above the folder, so leave room on top (about `lift + rows × 52px`).

## Props

| Prop              | Type                                | Default             | Description                                                                                                                |
| ----------------- | ----------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `items`           | `Array<string \| { label, value }>` | 4 feedback notes    | The pills that float out. A string is its own value.                                                                       |
| `label`           | `string`                            | `'Design feedback'` | The line on the flap.                                                                                                      |
| `sublabel`        | `string`                            | `''`                | The dimmer line under it. Empty counts the notes.                                                                          |
| `trigger`         | `'hover' \| 'click'`                | `'hover'`           | Open on hover, or toggle on press.                                                                                         |
| `default-open`    | `boolean`                           | `false`             | Start open.                                                                                                                |
| `close-on-select` | `boolean`                           | `true`              | Picking a pill closes the folder.                                                                                          |
| `physics`         | `boolean`                           | `true`              | Once the pills land, a zero-gravity world takes over: they float, collide, and can be dragged and thrown inside the cloud. |
| `drift`           | `number`                            | `0.5`               | Strength of the floating currents in the world. 0 holds still.                                                             |
| `folder-color`    | `string`                            | `'#3f3f46'`         | The back panel and its tab.                                                                                                |
| `front-color`     | `string`                            | `'#52525b'`         | The flap.                                                                                                                  |
| `paper-color`     | `string`                            | `'#f5f5f5'`         | The paper edge that rises as it opens.                                                                                     |
| `item-color`      | `string`                            | `'#f5f5f5'`         | The pills.                                                                                                                 |
| `item-text-color` | `string`                            | `'#18181b'`         | The pill text.                                                                                                             |
| `label-color`     | `string`                            | `'#f5f5f5'`         | The flap text.                                                                                                             |
| `width`           | `number`                            | `200`               | Folder width in px.                                                                                                        |
| `height`          | `number`                            | `148`               | Folder height in px, below the tab.                                                                                        |
| `radius`          | `number`                            | `14`                | Corner radius in px.                                                                                                       |
| `spread`          | `number`                            | `180`               | Half the widest the cloud may be, in px. Pills pack into rows within it.                                                   |
| `lift`            | `number`                            | `26`                | Gap between the folder and the lowest row, in px.                                                                          |
| `tilt`            | `number`                            | `8`                 | Most a pill leans, in degrees.                                                                                             |
| `flap-angle`      | `number`                            | `34`                | How far the flap tilts toward you when open, in degrees.                                                                   |
| `rest-angle`      | `number`                            | `16`                | The flap tilt when closed, in degrees.                                                                                     |
| `open-duration`   | `number`                            | `520`               | A pill's rise, in ms. The close is 60% of it.                                                                              |
| `stagger`         | `number`                            | `45`                | Delay between pills, in ms. The close reverses the order.                                                                  |
| `bounce`          | `number`                            | `0.3`               | Overshoot of the rise. 0 lands dead.                                                                                       |
| `class`           | `string`                            | `''`                | Extra classes for the root.                                                                                                |

## Events

| Event         | Payload                          | Description                  |
| ------------- | -------------------------------- | ---------------------------- |
| `select`      | `(value: string, index: number)` | A pill was picked.           |
| `update:open` | `boolean`                        | The folder opened or closed. |

## Accessibility

- The folder face is a button with `aria-expanded` and the label plus note count as its name; Enter or Space toggles it in either trigger mode.
- Closed pills are `aria-hidden` and out of the tab order; once open they are buttons you can Tab to and press. Escape closes the folder.
- Pills and the folder button show a focus ring on keyboard focus.
- With reduced motion, the flap stays at rest, pills fade instead of springing, and the physics world never starts.

- Ported from [React Bits](https://reactbits.dev/micro/folder-float) by David Haz.
