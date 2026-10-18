---
title: Glide Select
description: Select chip whose menu pops from its corner and whose highlight glides between rows.
---

A compact select. Press the chip and the menu pops from its corner; one highlight pill glides from row to row as you hover. You can also press, drag down the list and release on an option in one gesture. The keyboard works like a native combobox, including type-ahead.

::demo-glide-select
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glide-select.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import GlideSelect from '~/components/ui/glide-select/GlideSelect.vue';

  const format = ref('png');
  const formats = [
    { value: 'png', label: 'PNG', tag: 'Lossless' },
    { value: 'jpg', label: 'JPG', tag: 'Smallest' },
    { value: 'webp', label: 'WebP', tag: 'Modern' },
  ];
</script>

<template>
  <GlideSelect
    v-model="format"
    :options="formats"
    aria-label="Export format"
    @change="(value, option) => console.log(value, option.tag)"
  />
</template>
```

The highlight is a single absolutely positioned pill, moved with a CSS `transform` transition. When the menu opens, or when the pointer enters from outside, the pill jumps instead of gliding, so it never slides in from row 0.

## Props

| Prop                | Type                                                           | Default                   | Description                                                              |
| ------------------- | -------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| `options`           | `(string \| { value: string; label: string; tag?: string })[]` | `['One', 'Two', 'Three']` | The options. A string is both value and label. `tag` shows on the right. |
| `model-value`       | `string`                                                       | `undefined`               | Controlled value (`v-model`).                                            |
| `default-value`     | `string`                                                       | `''`                      | Initial value when uncontrolled.                                         |
| `placeholder`       | `string`                                                       | `'Select…'`               | Chip text when nothing is selected.                                      |
| `show-tags`         | `boolean`                                                      | `true`                    | Show each option's tag.                                                  |
| `accent-color`      | `string`                                                       | `'#f5f5f5'`               | Check mark and focus ring.                                               |
| `surface-color`     | `string`                                                       | `'#27272a'`               | Chip and menu background.                                                |
| `highlight-color`   | `string`                                                       | `'#3f3f46'`               | The gliding pill.                                                        |
| `text-color`        | `string`                                                       | `'#f5f5f5'`               | Labels; tags and chevron use it at 55%.                                  |
| `size`              | `'sm' \| 'md' \| 'lg'`                                         | `'md'`                    | Chip height 28, 32 or 44 px; rows and font follow.                       |
| `radius`            | `number`                                                       | `10`                      | Menu corner radius in px. Chip and rows use radius minus 4.              |
| `menu-width`        | `number`                                                       | `176`                     | Menu width in px. Never narrower than the chip.                          |
| `placement`         | `'top' \| 'bottom'`                                            | `'bottom'`                | Preferred side. Flips if the menu does not fit in the viewport.          |
| `align`             | `'left' \| 'right'`                                            | `'left'`                  | Edge the menu aligns to and pops from.                                   |
| `pop-duration`      | `number`                                                       | `180`                     | Menu pop-in in ms. Pop-out takes two thirds of it.                       |
| `glide-duration`    | `number`                                                       | `220`                     | Pill glide between rows in ms.                                           |
| `remember-position` | `boolean`                                                      | `true`                    | The pill stays on the row the pointer left. Off, it clears on leave.     |
| `disabled`          | `boolean`                                                      | `false`                   | Dims the chip and ignores input.                                         |
| `aria-label`        | `string`                                                       | `'Select'`                | Accessible name of the chip and the list.                                |
| `class`             | `string`                                                       | `''`                      | Extra classes for the root.                                              |

## Events

| Event               | Payload                                      | Description                          |
| ------------------- | -------------------------------------------- | ------------------------------------ |
| `update:modelValue` | `(value: string)`                            | A different option was picked.       |
| `change`            | `(value: string, option: GlideSelectOption)` | Same moment, with the option object. |

## Accessibility

- The chip is a `combobox` with `aria-expanded`, `aria-controls` and `aria-activedescendant`; the menu is a `listbox` of `option` rows with `aria-selected`.
- Enter, Space or the arrow keys open the menu. Arrow keys and Home / End move the highlight, letters jump by type-ahead, Enter or Space picks, Escape and Tab close.
- Focus stays on the chip the whole time. It shows a ring when focused from the keyboard.
- With `prefers-reduced-motion: reduce`, the menu fades without scaling and the pill moves without gliding.

- Ported from [React Bits](https://reactbits.dev/micro/glide-select) by David Haz.
