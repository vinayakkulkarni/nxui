---
title: Spring Check
description: A checkbox row where one spring fills the box, draws the tick and strikes through the label.
---

# Spring Check

A to-do style checkbox. Click a row, or focus it and press Space or Enter, to check it. One spring value drives everything: the fill grows out of the box center and swells slightly past full, the tick draws in, the words fade, and a rule wipes across the label. A pointer press dips the box, keyboard toggles snap without animation.

::demo-spring-check
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/spring-check.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import SpringCheck from '~/components/ui/spring-check/SpringCheck.vue';

  const shipped = ref(false);
</script>

<template>
  <div class="flex flex-col items-start gap-1">
    <SpringCheck v-model="shipped" label="Ship the build" />
    <SpringCheck label="Update the changelog" />
    <SpringCheck label="Book the launch call" default-checked strike="center" />
  </div>
</template>
```

Leave out `v-model` to let the row keep its own state, starting from `default-checked`. A change to `v-model` from outside also animates on the spring.

## Props

| Prop              | Type                                      | Default            | Description                                                            |
| ----------------- | ----------------------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `label`           | `string`                                  | `'Ship the build'` | Words beside the box. The rule matches their width.                    |
| `model-value`     | `boolean`                                 | `undefined`        | Checked state (`v-model`). Undefined means uncontrolled.               |
| `default-checked` | `boolean`                                 | `false`            | Initial state when uncontrolled.                                       |
| `disabled`        | `boolean`                                 | `false`            | Dims the row and ignores input.                                        |
| `color`           | `string`                                  | `'#ffffff'`        | Ink: the label, the ring, the rule and the focus outline.              |
| `fill-color`      | `string`                                  | `'#ffffff'`        | Fill that swells out of the box center.                                |
| `check-color`     | `string`                                  | `'#0b0b0f'`        | Stroke of the tick drawn over the fill.                                |
| `box-size`        | `number`                                  | `28`               | Box side in px. Ring, gap and row height derive from it.               |
| `box-radius`      | `number`                                  | `9`                | Box corner radius in px. Half the size makes a circle.                 |
| `font-size`       | `number`                                  | `18`               | Label size in px. The rule thickness derives from it.                  |
| `bounce`          | `number`                                  | `0.2`              | How far the fill swells past full. 0 arrives dead, 0.5 rebounds twice. |
| `strike-lag`      | `number`                                  | `0.12`             | Where on the spring the rule starts. 0 wipes with the fill.            |
| `done-opacity`    | `number`                                  | `0.42`             | How much ink the words keep once checked.                              |
| `strike`          | `'left' \| 'center' \| 'right' \| 'none'` | `'left'`           | Where the rule wipes from, or no rule.                                 |
| `aria-label`      | `string`                                  | `undefined`        | Accessible name when the label is not text.                            |
| `class`           | `string`                                  | `''`               | Extra classes for the row.                                             |

## Events

| Event               | Payload   | Description            |
| ------------------- | --------- | ---------------------- |
| `update:modelValue` | `boolean` | Fires on every toggle. |
| `change`            | `boolean` | Fires on every toggle. |

## Slots

| Slot      | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `default` | Replaces the label text. Set `aria-label` if it is not text. |

## Accessibility

- The row is a `<button role="checkbox">` with `aria-checked`, so Space and Enter toggle it.
- Keyboard focus draws an outline around the box in the ink color.
- With `prefers-reduced-motion`, the state changes without the spring or the press dip.

- Ported from [React Bits](https://reactbits.dev/micro/spring-check) by David Haz.
