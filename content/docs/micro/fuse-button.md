---
title: Fuse Button
description: Action button whose done state carries an undo on a burning fuse.
---

An action button with a built-in grace period. Click it and the face crossfades to **Undo** while a fuse burns around the pill (or along an edge). Click Undo, press Escape, or let the fuse run out. Hovering pauses the burn so you can read and decide.

::demo-fuse-button
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fuse-button.json"
```

## Usage

```vue
<script setup lang="ts">
  import FuseButton from '~/components/ui/fuse-button/FuseButton.vue';

  function archive() {
    console.log('archived');
  }

  function restore() {
    console.log('restored');
  }
</script>

<template>
  <FuseButton
    label="Archive"
    done-label="Archived"
    icon="lucide:archive"
    fuse-color="#f5a524"
    :undo-window="4000"
    @commit="archive"
    @undo="restore"
  />
</template>
```

## Props

| Prop             | Type                              | Default            | Description                                            |
| ---------------- | --------------------------------- | ------------------ | ------------------------------------------------------ |
| `label`          | `string`                          | `'Archive'`        | The idle action                                        |
| `undo-label`     | `string`                          | `'Undo'`           | The armed face that cancels                            |
| `done-label`     | `string`                          | `'Archived'`       | Announced on press; shown when `settle` is `'stay'`    |
| `icon`           | `string`                          | `'lucide:archive'` | Iconify name of the idle icon (or use the `icon` slot) |
| `color`          | `string`                          | `'#f5f5f5'`        | Text and icon ink                                      |
| `background`     | `string`                          | `'#27272a'`        | The pill surface                                       |
| `fuse-color`     | `string`                          | `'#f5a524'`        | The lit line or ring                                   |
| `size`           | `'sm' \| 'md' \| 'lg'`            | `'md'`             | Height, font and padding preset                        |
| `radius`         | `number`                          | `22`               | Corner radius in pixels                                |
| `undo-window`    | `number`                          | `4000`             | How long the undo stays available, in ms               |
| `fuse`           | `'outline' \| 'bottom' \| 'top'`  | `'outline'`        | A ring around the pill, or a line along one edge       |
| `fuse-thickness` | `number`                          | `1.5`              | Line height or rim stroke in pixels                    |
| `crossfade-ms`   | `number`                          | `200`              | Crossfade between faces, in ms                         |
| `commit-on`      | `'press' \| 'fuseEnd'`            | `'press'`          | Fire `commit` on press, or only when the fuse ends     |
| `pause-on-hover` | `boolean`                         | `true`             | Hovering the pill pauses the fuse (mouse only)         |
| `settle`         | `'reset' \| 'stay'`               | `'reset'`          | Return to idle, or stay done, after the fuse ends      |
| `disabled`       | `boolean`                         | `false`            | Disables the idle face                                 |
| `type`           | `'button' \| 'submit' \| 'reset'` | `'button'`         | Native type of the idle button                         |
| `class`          | `string`                          | `''`               | Extra classes for the pill                             |

## Events

| Event          | Payload                          | Description         |
| -------------- | -------------------------------- | ------------------- |
| `commit`       | `reason: 'press' \| 'fuseEnd'`   | The action          |
| `undo`         | —                                | Undo was used       |
| `fuse-end`     | —                                | The fuse burned out |
| `phase-change` | `'idle' \| 'armed' \| 'settled'` | Every phase change  |

## Slots

| Slot   | Description            |
| ------ | ---------------------- |
| `icon` | Replaces the idle icon |

## Accessibility

- Idle and Undo are real buttons; only the active face is focusable (the others are `inert`), and focus moves to Undo when armed and back afterwards.
- Escape undoes while armed (`aria-keyshortcuts="Escape"`); a polite live region announces the done label.
- Keyboard activation swaps faces instantly; the fuse pauses while the tab is hidden.
- With `prefers-reduced-motion`, the press squash, blur and icon spin are removed.

- Ported from [React Bits](https://reactbits.dev/micro/fuse-button) by David Haz.
