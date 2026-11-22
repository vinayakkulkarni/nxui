---
title: Segment Display
description: Seven-segment LCD digits with faint unlit segments, a soft glow and a slant, sized by font size.
---

# Segment Display

Seven-segment LCD digits for live readings, clocks and meters. Every cell shows a faint unlit `8` behind the lit segments, lit segments glow, and decimal points fold into the digit before them. The display is one SVG that scales with the font size.

::demo-segment-display
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/segment-display.json"
```

## Usage

```vue
<script setup lang="ts">
  import SegmentDisplay from '~/components/ui/segment-display/SegmentDisplay.vue';
</script>

<template>
  <SegmentDisplay value="4.82" color="#f59e0b" class="text-6xl" />
</template>
```

## Props

| Prop     | Type               | Default          | Description                                                                      |
| -------- | ------------------ | ---------------- | -------------------------------------------------------------------------------- |
| `value`  | `string \| number` | —                | Text to show. Digits, `-`, `_`, space, `.`, `:` and the letters A–F, H, L, P, U. |
| `digits` | `number`           | `0`              | Pads on the left with unlit cells to at least this many digits.                  |
| `color`  | `string`           | `'currentColor'` | Colour of the lit segments.                                                      |
| `ghost`  | `number`           | `0.12`           | Opacity of the unlit segments.                                                   |
| `glow`   | `boolean`          | `true`           | Adds a soft glow around lit segments.                                            |
| `slant`  | `number`           | `6`              | Slant in degrees. Positive values lean right.                                    |
| `label`  | `string`           | value            | Accessible label read by screen readers.                                         |
| `class`  | `string`           | `''`             | Extra classes. Set a font size such as `text-6xl` to size the display.           |

## Accessibility

- The display is an `svg` with `role="img"` and an `aria-label`, so screen readers read the value, not the segments.
- Pass a `label` that names the reading, for example `label="Battery level"`.
- Segment changes fade over 150 ms and switch instantly when the user prefers reduced motion.
