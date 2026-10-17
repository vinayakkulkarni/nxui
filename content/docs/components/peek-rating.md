---
title: Peek Rating
description: Star rating that lifts a wave of stars up to the pointer, then commits with a pop on click.
---

A star rating that previews before it commits. Move the pointer along the row and every star up to it rises, the one under the pointer grows, and a small tip names the score. Click (or release a drag on touch) to commit with a pop; click the current score again to clear it. Arrow keys, Home, End and Backspace work from the keyboard.

::demo-peek-rating
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/peek-rating.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import PeekRating from '~/components/ui/peek-rating/PeekRating.vue';

  const rating = ref(3);
</script>

<template>
  <PeekRating
    v-model="rating"
    :labels="['Poor', 'Fair', 'Good', 'Great', 'Superb']"
    active-color="#f5b400"
    :size="40"
    :lift="8"
  />
</template>
```

Without `v-model` the component keeps its own score, starting at `default-value`.

## Props

| Prop             | Type                          | Default     | Description                                                                                      |
| ---------------- | ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `model-value`    | `number`                      | `undefined` | Controlled rating, from 0 to `count` (use `v-model`).                                            |
| `default-value`  | `number`                      | `0`         | Initial rating when uncontrolled.                                                                |
| `count`          | `number`                      | `5`         | Number of glyphs.                                                                                |
| `shape`          | `'star' \| 'heart' \| 'bolt'` | `'star'`    | Built-in glyph shape.                                                                            |
| `icon`           | `string`                      | `''`        | Iconify name of a custom glyph that replaces the built-in shape.                                 |
| `labels`         | `string[]`                    | `[]`        | One label per glyph, shown in the tip while previewing. Without labels the tip shows the number. |
| `active-color`   | `string`                      | `'#f5b400'` | Colour of lit glyphs and of the focus ring.                                                      |
| `idle-color`     | `string`                      | `'#52525b'` | Colour of unlit glyphs.                                                                          |
| `tip-color`      | `string`                      | `'#27272a'` | Background of the tip that follows the pointer.                                                  |
| `tip-text-color` | `string`                      | `'#f5f5f5'` | Text colour of the tip.                                                                          |
| `size`           | `number`                      | `28`        | Glyph size in pixels; spacing and the tip scale with it.                                         |
| `lift`           | `number`                      | `6`         | How far previewed glyphs rise, in pixels. `0` makes the preview colour-only.                     |
| `magnify`        | `number`                      | `1.15`      | Scale of the glyph under the pointer.                                                            |
| `rise-duration`  | `number`                      | `320`       | Duration in ms of each glyph's rise and fall, and of the tip's hop.                              |
| `pop-scale`      | `number`                      | `1.3`       | Peak scale of the pop on the committed glyph. `1` disables it.                                   |
| `show-tip`       | `boolean`                     | `true`      | Shows the tip above the pointer glyph while previewing.                                          |
| `allow-clear`    | `boolean`                     | `true`      | Clicking the current rating again, or Backspace, clears it to 0.                                 |
| `read-only`      | `boolean`                     | `false`     | Display only: no preview, no pop, announced as an image.                                         |
| `disabled`       | `boolean`                     | `false`     | Dims the control and ignores input.                                                              |
| `aria-label`     | `string`                      | `'Rating'`  | Accessible name of the radio group.                                                              |
| `class`          | `string`                      | `''`        | Extra classes for the root element.                                                              |

## Events

| Event               | Payload          | Description                                                                    |
| ------------------- | ---------------- | ------------------------------------------------------------------------------ |
| `update:modelValue` | `number`         | A rating was committed (drives `v-model`).                                     |
| `change`            | `number`         | Same as above, for listeners that do not use `v-model`.                        |
| `preview`           | `number \| null` | Fired on every slot crossing while previewing, and with `null` when it clears. |

## Slots

| Slot   | Description                                      |
| ------ | ------------------------------------------------ |
| `icon` | Replaces the glyph inside every slot of the row. |

## Accessibility

- The row is a `radiogroup` of `radio` buttons with labels such as "3 of 5, Good", and only the checked star is in the tab order.
- Arrow keys step the score, Home and End jump to the ends, Backspace and Delete clear it, Space and Enter pick the focused star.
- Keyboard changes apply instantly, without the lift or pop.
- In `read-only` mode the whole row is one image announced as "3 of 5".
- With `prefers-reduced-motion`, glyphs do not lift or pop; only colour changes.

- Ported from [React Bits](https://reactbits.dev/micro/peek-rating) by David Haz.
